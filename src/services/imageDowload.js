import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
const convertColorToRgb = (color) => {
  if (!color || typeof color !== "string") return color;
  // If color is already in a supported format (hex, rgb, rgba), return it
  if (color.match(/^#[0-9a-fA-F]{6}$/) || color.match(/^rgb/)) {
    return color;
  }
  // For oklch or other unsupported formats, use a canvas to convert to rgb
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
};
const replaceOklchColors = (element) => {
  if (!element) return;

  // Replace background and text colors in computed styles
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;

  if (backgroundColor && backgroundColor.includes("oklch")) {
    element.style.backgroundColor = convertColorToRgb(backgroundColor);
  }
  if (color && color.includes("oklch")) {
    element.style.color = convertColorToRgb(color);
  }

  // Recursively process child elements
  Array.from(element.children).forEach((child) => replaceOklchColors(child));
};

const handleDownload = async (ref, format, title, code) => {
  const input = ref.current;

  // Replace oklch colors before capturing
  replaceOklchColors(input);

  // Ensure styles are applied before capturing
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(input, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
    });

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title}_${data.order_no}.pdf`);
    } else {
      // Download as JPG or PNG
      const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
      const imgData = canvas.toDataURL(mimeType, format === "jpg" ? 0.9 : 1.0);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${title}_${code}.${format}`;
      link.click();
    }
  } catch (error) {
    console.error("Error generating file:", error);
  }
};
export default handleDownload;
