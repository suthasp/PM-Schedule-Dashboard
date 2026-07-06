/** Dashboard export helpers: print-to-PDF and PNG screenshot. */

export function printDashboard(): void {
  window.print();
}

export async function downloadScreenshot(element: HTMLElement, filename: string): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    scale: 2,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
