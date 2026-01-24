import { supabaseAdmin } from "../supabase/supabaseAdmin.js";
import crypto from "crypto";

// ========================================
// SEND INVITATION
// ========================================
export async function sendInvitation(req, res) {
  try {
    const business_id = req.business_id;
    const { email, role } = req.body;

    // Validate
    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required" });
    }

    if (!['superadmin', 'staff'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'superadmin' or 'staff'" });
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, business_id')
      .eq('id', email)
      .single();

    if (existingProfile) {
      if (existingProfile.business_id === business_id) {
        return res.status(400).json({ 
          error: `User ${email} is already part of this business` 
        });
      } else {
        return res.status(400).json({ 
          error: `User ${email} belongs to another business` 
        });
      }
    }

    // Check for pending invitation
    const { data: pendingInvite } = await supabaseAdmin
      .from('business_invitations')
      .select('id')
      .eq('business_id', business_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (pendingInvite) {
      return res.status(400).json({ 
        error: "An invitation has already been sent to this email" 
      });
    }

    // Generate invitation token
    const invitation_token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('business_invitations')
      .insert({
        business_id,
        email,
        role,
        invited_by: req.user.id,
        invitation_token,
        status: 'pending',
        expires_at
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Get business name
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('id', business_id)
      .single();

    const invitation_link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitation_token}`;

    // TODO: Send invitation email
    console.log(`📧 Invitation email would be sent to: ${email}`);
    console.log(`🏢 Business: ${business?.name}`);
    console.log(`👤 Role: ${role}`);
    console.log(`🔗 Invitation link: ${invitation_link}`);

    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invitation_token,
        expires_at: invitation.expires_at,
        invitation_link
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: error.message || "Failed to send invitation" });
  }
}

// ========================================
// GET PENDING INVITATIONS
// ========================================
export async function getPendingInvitations(req, res) {
  try {
    const business_id = req.business_id;

    const { data: invitations, error } = await supabaseAdmin
      .from('business_invitations')
      .select(`
        *,
        invited_by_user:profiles!business_invitations_invited_by_fkey(name)
      `)
      .eq('business_id', business_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invited_by: inv.invited_by_user?.name,
        expires_at: inv.expires_at,
        created_at: inv.created_at
      }))
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch invitations" });
  }
}

// ========================================
// VERIFY INVITATION TOKEN (PUBLIC)
// ========================================
export async function verifyInvitationToken(req, res) {
  try {
    const { token } = req.params;

    const { data: invitation, error } = await supabaseAdmin
      .from('business_invitations')
      .select(`
        *,
        business:businesses(name)
      `)
      .eq('invitation_token', token)
      .single();

    if (error || !invitation) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from('business_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return res.status(400).json({ error: "This invitation has expired" });
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `This invitation has already been ${invitation.status}` 
      });
    }

    res.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        business_name: invitation.business?.name,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({ error: error.message || "Failed to verify invitation" });
  }
}

// ========================================
// ACCEPT INVITATION (PUBLIC)
// ========================================
export async function acceptInvitation(req, res) {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({ 
        error: "Token, name, and password are required" 
      });
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('business_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    // Verify invitation is still valid
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `This invitation has already been ${invitation.status}` 
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: "This invitation has expired" });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        business_id: invitation.business_id,
        name,
        role: invitation.role,
        is_active: true,
        invitation_accepted: true,
        invited_by: invitation.invited_by,
        invited_at: new Date()
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Mark invitation as accepted
    await supabaseAdmin
      .from('business_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date()
      })
      .eq('id', invitation.id);

    // Account created successfully - user needs to login to get token
    res.json({
      success: true,
      message: "Account created successfully. Please login to get your access token.",
      user: {
        id: profile.id,
        name: profile.name,
        email: invitation.email,
        role: profile.role,
        business_id: profile.business_id
      },
      next_step: {
        action: "login",
        url: "/api/auth/login",
        method: "Use the login script: node scripts/login-business-owner.js",
        credentials: {
          email: invitation.email,
          password: "The password you just set"
        }
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: error.message || "Failed to accept invitation" });
  }
}

// ========================================
// CANCEL INVITATION
// ========================================
export async function cancelInvitation(req, res) {
  try {
    const business_id = req.business_id;
    const { id } = req.params;

    // Verify invitation belongs to this business
    const { data: invitation, error: getError } = await supabaseAdmin
      .from('business_invitations')
      .select('*')
      .eq('id', id)
      .eq('business_id', business_id)
      .single();

    if (getError || !invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot cancel invitation that is ${invitation.status}` 
      });
    }

    // Update status
    const { error: updateError } = await supabaseAdmin
      .from('business_invitations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `Invitation to ${invitation.email} has been cancelled`
    });

  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: error.message || "Failed to cancel invitation" });
  }
}

// ========================================
// RESEND INVITATION
// ========================================
export async function resendInvitation(req, res) {
  try {
    const business_id = req.business_id;
    const { id } = req.params;

    // Get invitation
    const { data: invitation, error: getError } = await supabaseAdmin
      .from('business_invitations')
      .select('*')
      .eq('id', id)
      .eq('business_id', business_id)
      .single();

    if (getError || !invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot resend invitation that is ${invitation.status}` 
      });
    }

    // Extend expiration
    const new_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabaseAdmin
      .from('business_invitations')
      .update({ expires_at: new_expires_at })
      .eq('id', id);

    if (updateError) throw updateError;

    const invitation_link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitation.invitation_token}`;

    // TODO: Resend invitation email
    console.log(`📧 Invitation email would be resent to: ${invitation.email}`);
    console.log(`🔗 Invitation link: ${invitation_link}`);

    res.json({
      success: true,
      message: `Invitation resent to ${invitation.email}`,
      new_expires_at
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ error: error.message || "Failed to resend invitation" });
  }
}
