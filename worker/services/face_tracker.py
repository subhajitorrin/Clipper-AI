import os
import cv2
import numpy as np

class FaceTracker:
    def __init__(self):
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def detect_crop_center(self, video_path: str, sample_fps: float = 2.0) -> int:
        """
        Samples frames at sample_fps to detect faces and compute the optimal horizontal crop center X.
        Returns the target horizontal center coordinate (x).
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None

        video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(fps / sample_fps))

        default_center = video_width // 2
        
        # If the video is already vertical or square, no horizontal centering is needed
        target_width = int(video_height * (9 / 16))
        if target_width >= video_width:
            cap.release()
            return default_center

        min_crop_x = 0
        max_crop_x = video_width - target_width

        detected_centers = []
        weights = []

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                # Downscale frame for speed
                scale = 1.0
                h, w = frame.shape[:2]
                if w > 640:
                    scale = 640.0 / w
                    frame_small = cv2.resize(frame, (640, int(h * scale)))
                else:
                    frame_small = frame

                gray = cv2.cvtColor(frame_small, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(30, 30)
                )

                if len(faces) > 0:
                    # Pick the largest face (most likely the main character/speaker)
                    largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
                    fx, fy, fw, fh = largest_face
                    # Map back to original coordinate system
                    orig_fx = fx / scale
                    orig_fw = fw / scale
                    face_center_x = orig_fx + (orig_fw / 2.0)

                    # Weight by area (larger faces in foreground receive higher priority)
                    area = (orig_fw * (fh / scale))
                    detected_centers.append(face_center_x)
                    weights.append(area)

            frame_idx += 1

        cap.release()

        if not detected_centers:
            return default_center

        # Use weighted median / average with outlier rejection
        weights = np.array(weights)
        centers = np.array(detected_centers)
        
        # Weighted average of detected face positions
        weighted_center_x = int(np.sum(centers * weights) / np.sum(weights))

        # Clamp center coordinate so 9:16 crop box stays inside video frame
        half_crop = target_width / 2.0
        clamped_center = max(half_crop, min(video_width - half_crop, weighted_center_x))

        return int(clamped_center)
