// Stub for sodium-native in browser context
// The Stellar SDK uses its own pure JS fallback when sodium-native is unavailable

// Export the minimum API surface needed to prevent webpack errors
module.exports = {
  // Ed25519 key operations (handled by Stellar SDK's JS fallback)
  crypto_sign_keypair: () => {},
  crypto_sign_seed_keypair: () => {},
  crypto_sign: () => {},
  crypto_sign_open: () => {},
  crypto_sign_detached: () => {},
  crypto_sign_verify_detached: () => {},
  // Random bytes (handled by crypto.getRandomValues in browser)
  randombytes_buf: (buf: Uint8Array) => crypto.getRandomValues(buf),
  randombytes_buf_deterministic: () => {},
  // Memory
  sodium_memzero: () => {},
  sodium_mlock: () => {},
  sodium_munlock: () => {},
  // Utility
  crypto_generichash: () => {},
  crypto_generichash_batch: () => {},
  crypto_aead_xchacha20poly1305_ietf_encrypt: () => {},
  crypto_aead_xchacha20poly1305_ietf_decrypt: () => {},
};
