{
  description = "Development environment for CPSC-491 AI Career Buddy";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "x86_64-linux"
        "aarch64-linux"
      ];

      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22
              npm-check-updates
	      wrangler

              terraform
              terraform-ls
              tflint
              awscli2
	      supabase-cli

              jq
              ripgrep
              fd
              tree
            ];

            shellHook = ''
              echo "AI Career Buddy dev shell"
              echo "Node:      $(node --version)"
              echo "npm:       $(npm --version)"
              echo "Terraform: $(terraform version -json | jq -r .terraform_version)"
              echo
              echo "Common commands:"
              echo "  cd api && npm install && npm run dev"
              echo "  cd infra && terraform init && terraform plan"
            '';
          };
        });
    };
}
