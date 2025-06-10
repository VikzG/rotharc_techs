import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const TestimonialForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    quote: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour soumettre un témoignage');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          name: formData.name,
          title: formData.title,
          quote: formData.quote,
          user_id: user.id,
          image_url: '/ellipse-5.png', // Default image
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Témoignage soumis avec succès ! Il sera visible après modération.');
      setFormData({ name: '', title: '', quote: '' });
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('Erreur lors de la soumission du témoignage');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#d9d9d9] rounded-[25px] p-8 shadow-[15px_15px_38px_#989898e6,-15px_-15px_30px_#ffffffe6] max-w-2xl mx-auto mt-12"
    >
      <h3 className="text-2xl font-semibold mb-6 [font-family:'Montserrat_Alternates',Helvetica]">
        Partagez votre expérience
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#2C3E50] mb-2 [font-family:'Montserrat_Alternates',Helvetica]">
            Votre nom
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 bg-[#d9d9d9] rounded-[15px] text-[#2C3E50] placeholder-[#2C3E50]/50 shadow-[inset_5px_5px_13px_#a3a3a3e6,inset_-5px_-5px_10px_#ffffffe6] focus:outline-none focus:ring-2 focus:ring-[#2C8DB0] [font-family:'Montserrat_Alternates',Helvetica]"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2C3E50] mb-2 [font-family:'Montserrat_Alternates',Helvetica]">
            Votre profession
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2 bg-[#d9d9d9] rounded-[15px] text-[#2C3E50] placeholder-[#2C3E50]/50 shadow-[inset_5px_5px_13px_#a3a3a3e6,inset_-5px_-5px_10px_#ffffffe6] focus:outline-none focus:ring-2 focus:ring-[#2C8DB0] [font-family:'Montserrat_Alternates',Helvetica]"
            placeholder="Développeur, Designer, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2C3E50] mb-2 [font-family:'Montserrat_Alternates',Helvetica]">
            Votre témoignage
          </label>
          <textarea
            value={formData.quote}
            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            required
            rows={4}
            className="w-full px-4 py-2 bg-[#d9d9d9] rounded-[15px] text-[#2C3E50] placeholder-[#2C3E50]/50 shadow-[inset_5px_5px_13px_#a3a3a3e6,inset_-5px_-5px_10px_#ffffffe6] focus:outline-none focus:ring-2 focus:ring-[#2C8DB0] [font-family:'Montserrat_Alternates',Helvetica]"
            placeholder="Partagez votre expérience avec nos améliorations..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2 bg-[#2C8DB0] text-white hover:bg-[#2C8DB0]/90 shadow-[0_0_20px_rgba(44,141,176,0.3)] transition-all duration-300 [font-family:'Montserrat_Alternates',Helvetica] disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};