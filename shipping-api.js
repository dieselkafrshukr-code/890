/**
 * Shipping Company API Integration
 * This file handles sending orders to the shipping provider.
 * You can customize the API_URL and HEADERS with your actual provider details.
 */

const ShippingAPI = {
    // Replace with your actual Shipping Provider API details
    CONFIG: {
        URL: 'https://api.example-shipping-company.com/v1/orders', // Example URL
        API_KEY: 'YOUR_API_KEY_HERE',
        ENABLED: false // Set to true when you add your real API details
    },

    /**
     * Sends order data to the shipping provider
     * @param {Object} orderData - The order details from the checkout form
     * @returns {Promise<Object>} - API Response
     */
    async sendOrder(orderData) {
        if (!this.CONFIG.ENABLED) {
            console.log('ℹ️ Shipping API is currently disabled. Update shipping-api.js to enable it.');
            return { success: true, message: 'Disabled' };
        }

        console.log('🚀 Sending order to Shipping Company...', orderData);

        try {
            const response = await fetch(this.CONFIG.URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.CONFIG.API_KEY}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    // Map your local order data to the API's required format
                    sender: "EL TOUFAN STORE",
                    recipient_name: orderData.customer,
                    recipient_phone: orderData.phone,
                    recipient_phone2: orderData.phone2 || '',
                    recipient_address: orderData.address,
                    recipient_city: orderData.governorate,
                    items: orderData.item,
                    total_amount: orderData.total,
                    payment_method: orderData.paymentMethod === 'online' ? 'Prepaid/Online' : 'Cash on Delivery',
                    order_reference: orderData.id || `ORD-${Date.now()}`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send order to shipping company');
            }

            console.log('✅ Order successfully sent to Shipping Company!', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Shipping API Error:', error.message);
            // We return success: false but usually we don't block the user's order confirmation
            return { success: false, error: error.message };
        }
    }
};

// Export for use in main.js
window.ShippingAPI = ShippingAPI;
