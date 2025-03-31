/**
 * Creates a WhatsApp link with a pre-filled message
 *
 * @param message The message to pre-fill in WhatsApp
 * @param phoneNumber The phone number to send the message to (with country code)
 * @returns A properly formatted WhatsApp URL
 */
export function createWhatsAppLink(message: string, phoneNumber = "2520633916396"): string {
  // Ensure the message is properly URL encoded
  const encodedMessage = encodeURIComponent(message)

  // Format the WhatsApp URL
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
}

/**
 * Opens WhatsApp with a pre-filled message
 *
 * @param message The message to pre-fill in WhatsApp
 * @param phoneNumber The phone number to send the message to (with country code)
 */
export function openWhatsApp(message: string, phoneNumber = "2520633916396"): void {
  const whatsappUrl = createWhatsAppLink(message, phoneNumber)
  window.open(whatsappUrl, "_blank")
}

