/**
 * Client Service for communicating with the future Python Worker / FastAPI Service.
 *
 * NOTE: The Python worker operates primarily as an autonomous background consumer
 * polling Supabase with public.claim_next_job(), but this service allows Next.js
 * to optionally trigger immediate tasks or query worker cluster health.
 */

import {
  PythonWorkerHealthResponse,
  PythonProcessJobRequest,
  PythonProcessJobResponse,
} from "@/src/types/python.types";

const PYTHON_API_BASE_URL =
  process.env.PYTHON_API_BASE_URL ||
  process.env.NEXT_PUBLIC_PYTHON_API_BASE_URL ||
  "http://localhost:8000";

const PYTHON_API_SECRET = process.env.PYTHON_API_SECRET || "";

export class PythonService {
  /**
   * Check if Python worker cluster is reachable and healthy
   */
  static async checkHealth(): Promise<PythonWorkerHealthResponse | null> {
    try {
      // TODO: Connect to live Python service once backend implementation begins
      const res = await fetch(`${PYTHON_API_BASE_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(PYTHON_API_SECRET ? { Authorization: `Bearer ${PYTHON_API_SECRET}` } : {}),
        },
        cache: "no-store",
      });

      if (!res.ok) return null;
      return (await res.json()) as PythonWorkerHealthResponse;
    } catch {
      // Python backend not running yet (expected in Next.js-only phase)
      return null;
    }
  }

  /**
   * Request Python worker to immediately pick up a specific queued job
   */
  static async notifyNewJob(jobData: PythonProcessJobRequest): Promise<PythonProcessJobResponse | null> {
    try {
      // TODO: Connect to live Python service once backend implementation begins
      const res = await fetch(`${PYTHON_API_BASE_URL}/api/v1/jobs/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PYTHON_API_SECRET ? { Authorization: `Bearer ${PYTHON_API_SECRET}` } : {}),
        },
        body: JSON.stringify(jobData),
      });

      if (!res.ok) return null;
      return (await res.json()) as PythonProcessJobResponse;
    } catch {
      // Worker will autonomously claim via DB queue (public.claim_next_job)
      return null;
    }
  }
}
