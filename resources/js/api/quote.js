import apiClient from './client';

/**
 * Calculate live server-side quotation and tax breakdown for a product.
 */
export async function calculateQuote({ productId, jumlahPeserta = null, opsiIds = [] }) {
    const response = await apiClient.post('/pengajuan/quote', {
        product_id: productId,
        jumlah_peserta: jumlahPeserta ? parseInt(jumlahPeserta, 10) : null,
        opsi_ids: opsiIds,
    });
    return response.data;
}
