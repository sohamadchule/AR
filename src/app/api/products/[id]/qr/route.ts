import QRCode from "qrcode";

import { jsonError, requireAdmin } from "@/lib/api";
import { getProductById } from "@/lib/products";
import { buildViewUrl } from "@/lib/url";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/:id/qr — QR code for the product's public /view URL (admin).
 *
 * The QR always encodes `<base>/view/<id>` — never a storage/model URL — so the
 * model can be replaced without invalidating printed QR codes.
 *
 * Query params:
 *   format=png|svg   (default png)
 *   download=1       set a download filename
 *
 * The encoded target is echoed in the `x-qr-target` response header for easy
 * verification.
 */
export async function GET(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) return jsonError("Product not found", 404);

  const params = new URL(request.url).searchParams;
  const format = (params.get("format") ?? "png").toLowerCase();
  const download = params.get("download") === "1";

  const target = buildViewUrl(request, id);

  if (format === "svg") {
    const svg = await QRCode.toString(target, {
      type: "svg",
      margin: 2,
      width: 512,
      errorCorrectionLevel: "M",
    });
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
        "x-qr-target": target,
        ...(download
          ? { "content-disposition": `attachment; filename="qr-${id}.svg"` }
          : {}),
      },
    });
  }

  if (format !== "png") {
    return jsonError("Unsupported format. Use png or svg.", 400);
  }

  const png = await QRCode.toBuffer(target, {
    type: "png",
    margin: 2,
    width: 512,
    errorCorrectionLevel: "M",
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
      "x-qr-target": target,
      ...(download
        ? { "content-disposition": `attachment; filename="qr-${id}.png"` }
        : {}),
    },
  });
}
