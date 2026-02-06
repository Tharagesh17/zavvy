
'use server';

import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

export type JoinWaitlistResult = {
    success: boolean;
    message?: string;
    error?: string;
};

export async function joinWaitlist(formData: FormData): Promise<JoinWaitlistResult> {
    const email = formData.get('email') as string;
    const tier = formData.get('tier') as 'free' | 'pro';

    if (!email || !email.includes('@')) {
        return { success: false, error: 'Invalid email address' };
    }

    try {
        // 1. Check Pro tier availability (double check before insert)
        if (tier === 'pro') {
            const { count, error: countError } = await supabase
                .from('waitlist')
                .select('*', { count: 'exact', head: true })
                .eq('tier_interest', 'pro');

            if (countError) throw countError;

            if (count !== null && count >= 50) {
                return { success: false, error: 'Sorry, the Pro tier is sold out!' };
            }
        }

        // 2. Insert into Supabase
        // Note: The database trigger 'enforce_pro_cap' will also prevent >50 Pro users
        // acting as a final fail-safe.
        const { error: insertError } = await supabase
            .from('waitlist')
            .insert({
                email,
                tier_interest: tier,
                is_early_bird: tier === 'pro'
            });

        if (insertError) {
            if (insertError.code === '23505') { // Unique violation
                return { success: false, error: 'This email is already on the waitlist!' };
            }
            if (insertError.message.includes('sold out')) {
                return { success: false, error: 'Sorry, the Pro tier just sold out!' };
            }
            throw insertError;
        }

        // 3. Send automated welcome email
        // We don't await this to keep the UI response fast, or we can await if we want to ensure sending
        await sendWelcomeEmail(email, tier);

        return { success: true, message: 'Welcome to the club!' };
    } catch (error) {
        console.error('Error joining waitlist:', error);
        return { success: false, error: 'Something went wrong. Please try again.' };
    }
}

export async function getProCount() {
    const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('tier_interest', 'pro');

    return count || 0;
}
