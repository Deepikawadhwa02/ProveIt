import React, { useState } from 'react';

const faqData = [
  {
    question: "How do I sign up for the platform?",
    answer: "To sign up, click on the 'Sign Up' button on the homepage, enter your details, and create an account."
  },
  {
    question: "What is the format of the tests?",
    answer: "Tests are typically multiple choice or fill-in-the-blank, with a timer for each section."
  },
  {
    question: "Can I retake the test?",
    answer: "Yes, you can retake the test after a specific time period as per the platform's policy."
  },
  {
    question: "How do I contact support?",
    answer: "You can contact support through the contact form on this page or reach out to support@ourplatform.com."
  }
];

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [notification, setNotification] = useState("");
  const [activeFAQ, setActiveFAQ] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotification("Your message has been sent successfully!");
    setFormData({ name: "", email: "", message: "" });

    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-10 px-4 text-white">
      <div className="w-full max-w-4xl bg-white bg-opacity-10 shadow-2xl backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold drop-shadow-lg">Get in Touch – We're Here to Help!</h1>
        </div>

        {/* FAQ Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="border-b border-white/30 py-3 cursor-pointer transition-all hover:bg-white/10 rounded-lg p-4"
              onMouseEnter={() => setActiveFAQ(index)}
              onMouseLeave={() => setActiveFAQ(null)}
            >
              <div className="text-lg font-medium">{faq.question}</div>
              <div className={`mt-2 transition-all duration-300 ${activeFAQ === index ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'}`}>{faq.answer}</div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="mt-6">
          <h3 className="text-xl font-medium mb-4">Still have a query? Contact us:</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-white/20 text-white placeholder-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-white/20 text-white placeholder-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-white/20 text-white placeholder-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Enter your message"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <span className="mr-2">✅</span> {notification}
          <button className="ml-3 text-xl" onClick={() => setNotification('')}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default ContactPage;