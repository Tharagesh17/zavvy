const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export type ShiprocketLoginResponse = {
    token: string;
    expires_in?: number; // seconds until expiry
};

/**
 * Login to Shiprocket with email + password.
 * POST https://apiv2.shiprocket.in/v1/external/auth/login
 * Use API user credentials (Settings → API → Create API user in Shiprocket).
 * Token is valid for ~10 days (240 hours).
 */
export async function loginShiprocket(
    email: string,
    password: string
): Promise<{ token: string; expiresAt: Date }> {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Invalid email or password");
    }

    const data = (await response.json()) as ShiprocketLoginResponse & { expires_in?: number };
    const token = data.token;
    if (!token) throw new Error("No token in response");

    // Token valid ~10 days; compute expiry from expires_in (seconds) or default 10 days
    const expiresInSeconds = data.expires_in ?? 10 * 24 * 60 * 60; // 10 days
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return { token, expiresAt };
}

export type ShipmentPayload = {
    order_id: string;
    order_date: string;
    pickup_location: string;
    billing_customer_name: string;
    billing_last_name: string;
    billing_address: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    order_items: Array<{
        name: string;
        sku: string;
        units: number;
        selling_price: number;
    }>;
    payment_method: "COD" | "Prepaid";
    sub_total: number;
    length: number;
    breadth: number;
    height: number;
    weight: number;
};

export type ShipmentResponse = {
    shipment_id: number;
    order_id: string;
    awb_code: string;
    courier_name: string;
    status: string;
};

export type TrackingResponse = {
    tracking_data: {
        track_status: number;
        shipment_status: string;
        shipment_track: Array<{
            current_status: string;
            date: string;
        }>;
        shipment_track_activities: Array<{
            date: string;
            activity: string;
            location: string;
        }>;
    };
};

/**
 * Create shipment on Shiprocket
 */
export async function createShipment(
    token: string,
    payload: ShipmentPayload
): Promise<ShipmentResponse> {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Shipment creation failed");
    }

    const data = await response.json();
    return data;
}

/**
 * Track shipment by AWB code
 */
export async function trackShipment(
    token: string,
    awbCode: string
): Promise<TrackingResponse> {
    const response = await fetch(
        `${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Tracking fetch failed");
    }

    return await response.json();
}

/**
 * Check if token is expired.
 * Returns false if expiresAt is null (legacy API key had no expiry).
 */
export function isTokenExpired(expiresAt: string | null | undefined): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
}
