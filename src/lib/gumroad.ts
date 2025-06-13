interface GumroadLicenseResponse {
  success: boolean;
  uses: number;
  purchase: {
    product_name: string;
    product_id: string;
    created_at: string;
    full_name: string;
    purchaser_id: string;
    product_permalink: string;
    id: string;
    variants: string;
    test: boolean;
    status: string;
    subscription_id?: string;
    licence_key: string;
    quantity: number;
    gumroad_fee: number;
    currency: string;
    order_number: number;
    sale_id: string;
    sale_timestamp: string;
    url_params: Record<string, any>;
    ip_country: string;
    is_gift_receiver_purchase: boolean;
    refunded: boolean;
    disputed: boolean;
    dispute_won: boolean;
    is_multiseat_license: boolean;
    subscription_ended_at?: string;
    subscription_cancelled_at?: string;
    subscription_failed_at?: string;
    is_recurring_billing: boolean;
    can_contact: boolean;
    discover_fee_charged: boolean;
  };
  message?: string;
}

export async function verifyGumroadLicense(licenseKey: string): Promise<{
  isValid: boolean;
  isActive: boolean;
  status: 'active' | 'inactive' | 'unknown';
  message?: string;
}> {
  try {
    console.log('Verifying Gumroad license key:', licenseKey);
    
    const productId = process.env.GUMROAD_PRODUCT_ID;
    
    if (!productId) {
      console.error('GUMROAD_PRODUCT_ID is not set in environment variables');
      return {
        isValid: false,
        isActive: false,
        status: 'unknown',
        message: 'Server configuration error'
      };
    }

    console.log('Using product ID:', productId);

    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product_id: productId,
        license_key: licenseKey,
        increment_uses_count: 'false'
      })
    });

    console.log('Gumroad API response status:', response.status);
    const data: GumroadLicenseResponse = await response.json();
    console.log('Gumroad API response data:', JSON.stringify(data, null, 2));

    if (!data.success) {
      console.log('Gumroad license verification failed:', data.message);
      return {
        isValid: false,
        isActive: false,
        status: 'inactive',
        message: data.message || 'Invalid license key'
      };
    }

    const purchase = data.purchase;
    console.log('Purchase details:', JSON.stringify(purchase, null, 2));
    
    // Check if the purchase is refunded or disputed
    if (purchase.refunded || purchase.disputed) {
      console.log('License has been refunded or disputed');
      return {
        isValid: true,
        isActive: false,
        status: 'inactive',
        message: 'License has been refunded or disputed'
      };
    }

    // Check subscription status for recurring purchases
    if (purchase.is_recurring_billing) {
      console.log('Checking subscription status for recurring purchase');
      // If subscription has ended, cancelled, or failed
      if (purchase.subscription_ended_at || purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
        console.log('Subscription has ended, cancelled, or failed:', {
          ended_at: purchase.subscription_ended_at,
          cancelled_at: purchase.subscription_cancelled_at,
          failed_at: purchase.subscription_failed_at
        });
        return {
          isValid: true,
          isActive: false,
          status: 'inactive',
          message: 'Subscription has ended or been cancelled'
        };
      }
    }

    // License is valid and active
    console.log('License is valid and active');
    return {
      isValid: true,
      isActive: true,
      status: 'active',
      message: 'License is valid and active'
    };

  } catch (error) {
    console.error('Error verifying Gumroad license:', error);
    return {
      isValid: false,
      isActive: false,
      status: 'unknown',
      message: 'Error verifying license'
    };
  }
}
