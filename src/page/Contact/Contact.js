import React from 'react';
import './Contact.css';
import ContactFirstBanner from '../../Components/ContactFirstBanner/ContactFirstBanner';
import ContactDetailsBanner from '../../Components/ContactDetailsBanner/ContactDetailsBanner';
import Contacts from '../../Components/Contacts/Contacts';

const Contact = () => {
  return (
    <div>
      <div className="w-100 mx-auto">
        <ContactFirstBanner></ContactFirstBanner>
        <ContactDetailsBanner></ContactDetailsBanner>
        <Contacts></Contacts>
      </div>
    </div>
  );
};

export default Contact;
