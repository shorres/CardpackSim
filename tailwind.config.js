/** Tailwind build config.
 *  The app previously loaded the Tailwind play CDN at runtime, which meant it could not
 *  render without internet access and pulled a script into a privileged Electron
 *  renderer. This builds the equivalent stylesheet at dev time into src/vendor/tailwind.css.
 *  Regenerate with:  npm run build:css
 */
module.exports = {
  content: [
    './index.html',
    './src/js/**/*.js'
  ],
  theme: { extend: {} },
  plugins: []
};
