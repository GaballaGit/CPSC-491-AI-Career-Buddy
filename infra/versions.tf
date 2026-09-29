terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }

    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }
}