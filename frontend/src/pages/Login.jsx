import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requestOTP, verifyOTP } from "../api";
import { ArrowRight, Lock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1); // 1 = Phone Entry, 2 = OTP Verification
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds countdown
  const [devOtp, setDevOtp] = useState(null); // Demo OTP
  const [isErrorShake, setIsErrorShake] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-submit OTP when 6 digits are entered
  useEffect(() => {
    const fullOtp = otpValues.join("");
    if (fullOtp.length === 6 && step === 2 && !isLoading) {
      handleVerifyOTP(fullOtp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValues, step]);

  const triggerShake = () => {
    setIsErrorShake(true);
    setTimeout(() => setIsErrorShake(false), 500);
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
    if (raw.length > 5) {
      setFormattedPhone(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setFormattedPhone(raw);
    }
  };

  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit number.");
      triggerShake();
      return;
    }

    setIsLoading(true);
    const cleanPhone = phone.replace(/\s/g, "");
    try {
      const data = await requestOTP(cleanPhone);
      toast.success("OTP sent successfully!");
      if (data.demo_otp) {
        setDevOtp(data.demo_otp);
      }
      setStep(2);
      setCountdown(30);
      setOtpValues(["", "", "", "", "", ""]);
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 500);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to send OTP.";
      toast.error(errMsg);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/\s/g, "");
    try {
      const data = await verifyOTP(cleanPhone, otpCode);
      login(data.access_token, data.user);
      toast.success(`Welcome to Savomart, ${data.user.name}!`);
      navigate("/");
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Invalid or expired OTP.";
      toast.error(errMsg);
      triggerShake();
      setOtpValues(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join("");
    if (fullOtp.length === 6) {
      handleVerifyOTP(fullOtp);
    } else {
      triggerShake();
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleRequestOTP();
  };

  const handleOtpChange = (index, e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otpValues];
    newOtp[index] = val.slice(-1);
    setOtpValues(newOtp);

    if (val && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).replace(/\D/g, "");
    if (pastedData) {
      const newOtp = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpValues(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#782B90] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          /* Hide scrollbar for a cleaner look */
          ::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-savomart-yellow/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header section outside the card */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight flex items-center justify-center">
          SAVO<span className="text-savomart-yellow">mart</span>
        </h1>
        <p className="text-white/80 mt-2 text-sm md:text-base font-medium tracking-wide">
          Your loyalty, rewarded.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden">
          {/* Inner container for sliding animation */}
          <div
            className="flex w-[200%] transition-transform duration-500 ease-in-out"
            style={{ transform: step === 1 ? "translateX(0)" : "translateX(-50%)" }}
          >
            {/* ================= STAGE 1: PHONE ENTRY ================= */}
            <div className="w-1/2 p-8 md:p-10 flex flex-col">
              <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
              
              <form onSubmit={handleRequestOTP} className={`flex-1 flex flex-col justify-center ${isErrorShake && step === 1 ? 'animate-shake' : ''}`}>
                <div className="mb-6">
                  <div className="relative flex items-center bg-white/10 border border-white/20 rounded-2xl focus-within:border-savomart-yellow focus-within:ring-1 focus-within:ring-savomart-yellow transition-all">
                    <span className="pl-5 pr-2 text-white/80 font-bold text-lg select-none">
                      +91
                    </span>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <input
                      type="tel"
                      value={formattedPhone}
                      onChange={handlePhoneChange}
                      placeholder="Enter mobile number"
                      className="w-full py-4 pr-5 bg-transparent text-white font-bold text-lg tracking-wider placeholder-white/40 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="w-full bg-savomart-yellow hover:bg-yellow-400 text-savomart-purple-dark font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(255,242,0,0.2)] hover:shadow-[0_8px_25px_rgba(255,242,0,0.3)] transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <p className="text-center text-white/60 text-xs mt-6 font-medium">
                  New here? We'll create your account automatically.
                </p>
              </form>
            </div>

            {/* ================= STAGE 2: OTP VERIFICATION ================= */}
            <div className="w-1/2 p-8 md:p-10 flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-white leading-tight">Enter OTP</h2>
                  <p className="text-sm text-white/70 mt-1">
                    Sent to +91 ****{phone.slice(-4)}
                  </p>
                </div>
              </div>

              <form onSubmit={handleManualVerify} className={`flex-1 flex flex-col justify-center ${isErrorShake && step === 2 ? 'animate-shake' : ''}`}>
                <div className="flex justify-between space-x-2 mb-8">
                  {otpValues.map((v, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={(e) => handleOtpChange(index, e)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 md:w-14 md:h-16 bg-white/10 border border-white/20 text-white rounded-xl text-center text-2xl font-extrabold focus:outline-none focus:border-savomart-yellow focus:ring-1 focus:ring-savomart-yellow transition-all"
                    />
                  ))}
                </div>

                {devOtp && (
                  <div className="mb-6 bg-yellow-50 rounded-xl p-3 flex items-start space-x-3 border border-yellow-200">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Demo Mode</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Use OTP: <span className="font-mono font-bold text-lg bg-yellow-200 px-2 py-0.5 rounded text-yellow-900">{devOtp}</span>
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otpValues.join("").length !== 6}
                  className="w-full bg-savomart-yellow hover:bg-yellow-400 text-savomart-purple-dark font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(255,242,0,0.2)] hover:shadow-[0_8px_25px_rgba(255,242,0,0.3)] transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading}
                    className={`text-sm font-bold transition-colors ${
                      countdown > 0
                        ? "text-white/40 cursor-not-allowed"
                        : "text-savomart-yellow hover:text-yellow-300"
                    }`}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center z-10 relative">
        <a 
          href="/admin/login"
          className="text-xs opacity-50 hover:opacity-100"
          style={{ color: 'white' }}>
          Admin Portal →
        </a>
      </div>
    </div>
  );
};

export default Login;
