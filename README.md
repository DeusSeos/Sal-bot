# Sal-bot

Edits the node_modules `discord-play`, generate patch with `npx patch-package "discord-play"`, apply patch with `patch-package` or `git apply --ignore-whitespace patches/discord-play+2.2.0.patch`.
Compile with `cd node_modules/discord-play/dist; tsc index.ts --declaration --sourceMap --esModuleInterop; rm src/*.d.ts; tsc src/*.ts --declaration --sourceMap --esModuleInterop; cd -;`