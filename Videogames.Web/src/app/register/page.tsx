"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    city: "",
    country: "",
    phone: "",
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    try {
      await register({
        ...formData,
        password: formData.password,
        recaptchaToken,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-10">
      <div className="bg-slate-700 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-white">First Name</label>
              <input
                name="firstName"
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white">Last Name</label>
              <input
                name="lastName"
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-white">Email</label>
            <input
              name="email"
              type="email"
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white">Password</label>
            <input
              name="password"
              type="password"
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white">Address</label>
            <input
              name="address"
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-white">City</label>
              <input
                name="city"
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-white">Country</label>
              <input
                name="country"
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-white">Phone</label>
            <input
              name="phone"
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="mb-6 flex justify-center">
            <ReCAPTCHA
              sitekey={
                process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              } // Test key
              onChange={handleRecaptchaChange}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
