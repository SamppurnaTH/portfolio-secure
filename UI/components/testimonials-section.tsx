"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  company: string;
  image?: string;
  content: string;
  rating: number;
  relationship?: string;
  project?: string;
  status?: 'draft' | 'published';
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchTestimonials = async () => {
      setIsLoading(true);
      setError(null);

      if (!API_BASE_URL) {
        console.error("NEXT_PUBLIC_API_URL is not defined. Cannot fetch testimonials.");
        setError("API base URL is not configured. Please check your .env.local file.");
        setIsLoading(false);
        return;
      }

      try {
        // Use API_BASE_URL for the fetch call
        const response = await fetch(`${API_BASE_URL}/api/testimonials`);
        
        if (!response.ok) {
          // Attempt to parse error message from response body
          const errorBody = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure data.success and data.data is an array
        if (data.success && Array.isArray(data.data)) {
          setTestimonials(data.data.filter((t: Testimonial) => 
            t.status === undefined || t.status === 'published'
          ));
        } else {
          console.warn("API response was successful but 'data' array was not found or was not an array:", data);
          setTestimonials([]);
          setError("No testimonial data received or data format is incorrect.");
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error("Fetch error:", error);
        setTestimonials([]); // Clear testimonials on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, [API_BASE_URL]); // Add API_BASE_URL to dependency array

  useEffect(() => {
    if (isLoading || error || testimonials.length === 0 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials, isLoading, error]);

  const nextTestimonial = () => {
    if (testimonials.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    if (testimonials.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    if (testimonials.length === 0 || index < 0 || index >= testimonials.length) return;
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (isLoading) {
    return (
      <section className="py-20 relative overflow-hidden flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="ml-4 text-gray-400">Loading testimonials...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 relative overflow-hidden text-center text-red-400">
        <p>Error: {error}</p>
        <p>Please try again later.</p>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-20 relative overflow-hidden text-center text-gray-400">
        <p>No testimonials to display yet.</p>
      </section>
    );
  }

  const currentTestimonial = testimonials[currentIndex];
  const initials = currentTestimonial.name
    .split(" ")
    .map(n => n[0]?.toUpperCase() ?? '')
    .join("");

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            What People Say
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Testimonials from mentors, colleagues, and supervisors I've worked with
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-12"
        >
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-6 left-6 text-cyan-400/20">
              <Quote className="h-16 w-16" />
            </div>

            <CardContent className="p-8 md:p-12 relative z-10">
              <motion.div
                key={currentTestimonial._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-center mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-6 w-6 ${i < currentTestimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <blockquote className="text-xl md:text-2xl text-gray-300 text-center mb-8 leading-relaxed italic">
                  &ldquo;{currentTestimonial.content}&rdquo;
                </blockquote>

                <div className="flex items-center justify-center gap-4">
                  {/* Use currentTestimonial.image directly */}
                  {currentTestimonial.image ? (
                    <Image
                      src={currentTestimonial.image}
                      alt={`Portrait of ${currentTestimonial.name}`}
                      width={80}
                      height={80}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-white">{currentTestimonial.name}</h4>
                    <p className="text-cyan-400 font-medium">{currentTestimonial.role}</p>
                    <p className="text-gray-400 text-sm">{currentTestimonial.company}</p>
                  </div>
                </div>

                {(currentTestimonial.relationship || currentTestimonial.project) && (
                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {currentTestimonial.relationship && (
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded-full text-sm text-purple-300">
                        {currentTestimonial.relationship}
                      </span>
                    )}
                    {currentTestimonial.project && (
                      <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-green-500/20 border border-cyan-400/30 rounded-full text-sm text-cyan-300">
                        {currentTestimonial.project}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={prevTestimonial}
            disabled={testimonials.length <= 1}
            aria-label="Previous testimonial"
            className="p-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 transition-all duration-300 disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous testimonial</span>
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                aria-label={`View testimonial ${index + 1} of ${testimonials.length}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-gradient-to-r from-cyan-400 to-purple-600 scale-125"
                    : "bg-slate-600 hover:bg-slate-500"
                }`}
              >
                <span className="sr-only">Testimonial {index + 1}</span>
              </button>
            ))}
          </div>

          <button
            onClick={nextTestimonial}
            disabled={testimonials.length <= 1}
            aria-label="Next testimonial"
            className="p-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 transition-all duration-300 disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next testimonial</span>
          </button>
        </div>

        {testimonials.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {testimonials.map((testimonial, index) => {
              const itemInitials = testimonial.name
                .split(" ")
                .map(n => n[0]?.toUpperCase() ?? '')
                .join("");

              return (
                <motion.div
                  key={testimonial._id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => goToTestimonial(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View testimonial from ${testimonial.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      goToTestimonial(index);
                    }
                  }}
                  className={`cursor-pointer transition-all duration-300 ${
                    index === currentIndex ? "ring-2 ring-cyan-400/50" : ""
                  }`}
                >
                  <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300 h-full">
                    <CardContent className="p-4 text-center">
                      {testimonial.image ? (
                        <Image
                          src={testimonial.image}
                          alt={`Portrait of ${testimonial.name}`}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover mx-auto mb-3"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
                          {itemInitials}
                        </div>
                      )}
                      <h5 className="font-medium text-white text-sm mb-1">{testimonial.name}</h5>
                      <p className="text-xs text-gray-400 mb-2">{testimonial.company}</p>
                      <div className="flex justify-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
