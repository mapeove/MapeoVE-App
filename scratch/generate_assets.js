const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicLogo = path.join(__dirname, '..', 'public', 'mapeove-logo.png');
const assetsDir = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

const iconPath = path.join(assetsDir, 'icon.png');
const splashPath = path.join(assetsDir, 'splash.png');

async function main() {
  try {
    console.log('Reading public/mapeove-logo.png...');
    const metadata = await sharp(publicLogo).metadata();
    console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

    // Create a 1024x1024 icon
    // We can resize the logo and put it on a background, or just resize it
    console.log('Generating assets/icon.png...');
    await sharp(publicLogo)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 11, g: 61, b: 145, alpha: 1 } // #0B3D91 background
      })
      .toFile(iconPath);
    console.log('assets/icon.png generated successfully!');

    // Create a 2732x2732 splash screen
    // Let's place the logo (sized down to 800px width/height to fit nicely) in the center of a 2732x2732 blue background
    console.log('Generating assets/splash.png...');
    const logoResized = await sharp(publicLogo)
      .resize(800, 800, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background for the logo
      })
      .toBuffer();

    await sharp({
      create: {
        width: 2732,
        height: 2732,
        channels: 4,
        background: { r: 11, g: 61, b: 145, alpha: 1 } // #0B3D91 background
      }
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .toFile(splashPath);
    console.log('assets/splash.png generated successfully!');

  } catch (err) {
    console.error('Error generating assets:', err);
  }
}

main();
