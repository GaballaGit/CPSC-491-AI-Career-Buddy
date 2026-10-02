/** Jobs Edge Function entry point (C40CS-20). */
import { handleJobsRequest } from "./handler.ts";

Deno.serve(handleJobsRequest);
