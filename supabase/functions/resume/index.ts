/** Resume Edge Function entry point (C40CS-11). */
import { handleResumeUpload } from "./handler.ts";

Deno.serve(handleResumeUpload);
