import * as shell from "shelljs";

shell.cp("-R", "src/public/*", "dist/public/");
shell.mkdir("-p", "dist/public/app");
shell.cp("-R", "../menu-ui/dist/*", "dist/public/app/");