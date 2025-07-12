const path = require("path");

const buildEslintCommand = (filenames) =>
  `dotenv -e .env -- next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [
    "prettier --write",
    (filenames) => buildEslintCommand(filenames),
  ],
};
