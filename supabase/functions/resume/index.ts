/** Resume Edge Function entry point (C40CS-11, C40CS-12). */
import { handleResumeRequest } from "./handler.ts";

Deno.serve(handleResumeRequest);
