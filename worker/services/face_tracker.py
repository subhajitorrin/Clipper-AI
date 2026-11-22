import os
import cv2
import numpy as np

class FaceTracker:
    def __init__(self):
        # Prefer high-accuracy deep learning YuNet model
        yunet_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "face_detection_yunet_2023mar.onnx"))
        self.yunet_path = yunet_path if os.path.exists(yunet_path) else None
        
        # Fallback to Haar Cascades (frontal + profile for angled podcast speakers)
        frontal_path = cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
        if not os.path.exists(frontal_path):
            frontal_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        profile_path = cv2.data.haarcascades + "haarcascade_profileface.xml"
        
        self.frontal_cascade = cv2.CascadeClassifier(frontal_path)
        self.profile_cascade = cv2.CascadeClassifier(profile_path) if os.path.exists(profile_path) else None

    def _detect_faces_yunet(self, frame_small, orig_w, orig_h, scale_w, scale_h):
        """Detect faces using YuNet neural network."""
        try:
            h, w = frame_small.shape[:2]
            detector = cv2.FaceDetectorYN.create(
                model=self.yunet_path,
                config="",
                input_size=(w, h),
                score_threshold=0.6,
                nms_threshold=0.3,
                top_k=10
            )
            _, faces = detector.detect(frame_small)
            if faces is None or len(faces) == 0:
                return []

            results = []
            for face in faces:
                fx, fy, fw, fh = face[0:4]
                orig_fx = fx / scale_w
                orig_fy = fy / scale_h
                orig_fw = fw / scale_w
                orig_fh = fh / scale_h
                confidence = face[14] if len(face) > 14 else 1.0
                results.append((orig_fx, orig_fy, orig_fw, orig_fh, confidence))
            return results
        except Exception:
            return []

    def _detect_faces_haar(self, gray_small, scale_w, scale_h):
        """Fallback face detection using Haar Cascades (both frontal and profile)."""
        faces = list(self.frontal_cascade.detectMultiScale(
            gray_small, scaleFactor=1.1, minNeighbors=4, minSize=(24, 24)
        ))
        
        if self.profile_cascade is not None:
            # Also detect profile/angled views common in podcasts
            profiles = list(self.profile_cascade.detectMultiScale(
                gray_small, scaleFactor=1.1, minNeighbors=4, minSize=(24, 24)
            ))
            faces.extend(profiles)

        results = []
        for (fx, fy, fw, fh) in faces:
            orig_fx = fx / scale_w
            orig_fy = fy / scale_h
            orig_fw = fw / scale_w
            orig_fh = fh / scale_h
            results.append((orig_fx, orig_fy, orig_fw, orig_fh, 1.0))
        return results

    def detect_crop_center(self, video_path: str, sample_fps: float = 3.0) -> int:
        """
        Samples frames across the video clip to detect the primary speaker / character.
        Scores candidate positions based on face area, prominence, confidence, and temporal consistency.
        Returns the optimal clamped horizontal center (X).
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None

        video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(fps / sample_fps))

        default_center = video_width // 2
        target_width = int(video_height * (9 / 16))

        # If already vertical or square, no horizontal crop calculation needed
        if target_width >= video_width:
            cap.release()
            return default_center

        detected_centers = []
        weights = []

        frame_idx = 0
        target_small_w = 640

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                h, w = frame.shape[:2]
                scale = min(1.0, target_small_w / w)
                small_w = int(w * scale)
                small_h = int(h * scale)
                frame_small = cv2.resize(frame, (small_w, small_h))
                scale_w = small_w / float(w)
                scale_h = small_h / float(h)

                faces = []
                if self.yunet_path:
                    faces = self._detect_faces_yunet(frame_small, w, h, scale_w, scale_h)

                if not faces:
                    gray_small = cv2.cvtColor(frame_small, cv2.COLOR_BGR2GRAY)
                    faces = self._detect_faces_haar(gray_small, scale_w, scale_h)

                if faces:
                    # Score faces by area * confidence
                    # The main speaking character in podcasts / interviews occupies the most prominent frame area
                    best_face = max(faces, key=lambda f: (f[2] * f[3]) * f[4])
                    fx, fy, fw, fh, conf = best_face

                    face_center_x = fx + (fw / 2.0)
                    area = fw * fh
                    detected_centers.append(face_center_x)
                    weights.append(area * conf)

            frame_idx += 1

        cap.release()

        if not detected_centers:
            return default_center

        weights = np.array(weights, dtype=np.float32)
        centers = np.array(detected_centers, dtype=np.float32)

        # Remove extreme outliers: filter values outside 15th-85th percentile if sufficient detections
        if len(centers) >= 5:
            p20 = np.percentile(centers, 20)
            p80 = np.percentile(centers, 80)
            valid_mask = (centers >= p20 - 100) & (centers <= p80 + 100)
            if np.any(valid_mask):
                centers = centers[valid_mask]
                weights = weights[valid_mask]

        weighted_center_x = int(np.sum(centers * weights) / np.sum(weights))

        # Clamp center coordinate so 9:16 crop window stays within video boundaries
        half_crop = target_width / 2.0
        clamped_center = max(half_crop, min(video_width - half_crop, weighted_center_x))

        return int(clamped_center)
