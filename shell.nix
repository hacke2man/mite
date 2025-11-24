{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
	buildInputs = with pkgs; [
		sqlite
		go
		gopls
		typescript-language-server
		vscode-langservers-extracted
		watchexec
	];
	shellHook = ''
		export LSPSERVERS="$LSPSERVERS,html,ts_ls,gopls"
	'';
}
