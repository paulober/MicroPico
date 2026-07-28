export const PICO_VARIANTS = ["Pico (H)", "Pico W(H)"];
export const PICO_VARAINTS_PINOUTS = ["pico-pinout.svg", "picow-pinout.svg"];

export function getPinMapHtml(variantName: string, imageUrl: string): string {
  return (
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${variantName} Pinout</title>
        <style type="text/css">
            body {
                background-color: transparent;
            }
        </style>
    </head>
    <body>
        <img src="${imageUrl}" alt="${variantName} pinout graphic" />
        <p style="color: #fff; font-size: 12px; margin-top: 10px;">Image from` +
    ' <a href="https://www.raspberrypi.com/documentation/microcontrollers' +
    '/raspberry-pi-pico.html" style="color: #fff; text-decoration: none;">' +
    `© ${new Date().getFullYear()} Copyright Raspberry Pi Foundation</a></p>
    </body>
    </html>`
  );
}
