import React from "react";
import "./WhatsAppButton.css";

const WhatsAppButton = () => {
  // Replace with your WhatsApp number in international format (no +, no spaces)
  const phoneNumber = "601173003929";

  // Optional prefilled message
  const message = "Hello! I want to get in touch.";

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappLink}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        className="whatsapp-icon"
      />
    </a>
  );
};

export default WhatsAppButton;