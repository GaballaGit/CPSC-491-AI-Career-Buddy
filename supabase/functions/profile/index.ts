/** Career Profile Edge Function entry point (C40CS-32). */
import { handleProfileRequest } from "./handler.ts";

Deno.serve(handleProfileRequest);
