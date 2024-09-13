import { tmpdir } from "os";
import { basename, join } from "path";
import { createWriteStream } from "fs";
import { request } from "undici";

export enum SupportedFirmwareTypes {
  pico,
  picow,
  pico2,
}

function firmwareTypeToDownloadURL(
  firmwareType: SupportedFirmwareTypes
): string {
  switch (firmwareType) {
    case SupportedFirmwareTypes.pico:
      return "https://micropython.org/download/RPI_PICO/";
    case SupportedFirmwareTypes.picow:
      return "https://micropython.org/download/RPI_PICO_W/";
    case SupportedFirmwareTypes.pico2:
      return "https://micropython.org/download/RPI_PICO2/";
  }
}

async function extractUf2Url(
  url: string,
  allowPreview: boolean
): Promise<string | null> {
  try {
    // Fetch the content of the URL using Undici
    const { body, headers } = await request(url);
    const contentType = headers["content-type"];

    // Check if the content is HTML
    if (contentType?.includes("text/html")) {
      let html = "";
      for await (const chunk of body) {
        html += chunk;
      }

      // Split the document at <h2>Firmware</h2>
      const splitHtml = html.split("<h2>Firmware</h2>");
      if (splitHtml.length < 2) {
        console.log("No Firmware section found.");

        return null;
      }

      const firmwareSection = splitHtml[1];

      // Use regex to find the first .uf2 URL inside <strong> tags
      const uf2Regex = allowPreview
        ? /<a[^>]+href="([^"]+\.uf2)"/
        : /<strong>\s*<a[^>]+href="([^"]+\.uf2)"/;
      const match = uf2Regex.exec(firmwareSection);

      if (match?.[1]) {
        return match[1];
      } else {
        console.log("No .uf2 link found inside <strong>.");

        return null;
      }
    } else {
      console.log("The URL did not return HTML content.");

      return null;
    }
  } catch (error) {
    console.error("Error fetching or processing the URL:", error);

    return null;
  }
}

export async function downloadFirmware(
  firmwareType: SupportedFirmwareTypes
): Promise<string | undefined> {
  const url = firmwareTypeToDownloadURL(firmwareType);
  const uf2Url = await extractUf2Url(
    url,
    // TODO: remove after stable builds for Pico2 are available
    firmwareType === SupportedFirmwareTypes.pico2
  );

  if (!uf2Url) {
    console.error("No UF2 URL found.");

    return;
  }

  try {
    // Fetch the .uf2 file using Undici
    const { body } = await request(`https://micropython.org${uf2Url}`);

    // Get the filename from the URL
    const fileName = basename(uf2Url);

    // Create the path for the file in the system temp directory
    const tempDir = tmpdir();
    const filePath = join(tempDir, fileName);

    // Stream the file content to the temp directory
    const fileStream = createWriteStream(filePath);
    body.pipe(fileStream);

    await new Promise<void>((resolve, reject) => {
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    console.log(`Firmware downloaded to: ${filePath}`);

    return filePath;
  } catch (error) {
    console.error("Error downloading the UF2 file:", error);

    return;
  }
}
