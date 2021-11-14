# Sal-bot

**Generating a patch of module changes:**

To generate the patch file use `npx patch-package "{module-name}" `.

**Applying discord-play patches after git pull:**

Use `npx patch-package` or `git apply --ignore-whitespace patches/discord-play+2.2.0.patch`.
Compile with changes with `cd node_modules/discord-play/dist; tsc index.ts --declaration --sourceMap --esModuleInterop; rm src/*.d.ts; tsc src/*.ts --declaration --sourceMap --esModuleInterop; cd -;`

