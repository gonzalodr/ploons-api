import { StatusCodes } from 'http-status-codes';
import { prisma } from '@config/db.config';
import { supabase } from '@config/supabase.config';
import { LoginInput } from '@module/auth/schemas/auth.login.schema';
import { RegisterInput } from '@module/auth/schemas/auth.register.schema';
import { AppError } from '@utils/appError.utils';
export class AuthService {
  /*-------------------------------------
   *      REGISTER PROCESS
   *-------------------------------------*/
  // 1. register new user
  async register(input: RegisterInput) {
    const { email, password, first_name, last_name } = input;
    const existingUser = await prisma.profiles.findFirst({ where: { email: email } });
    if (existingUser) {
      throw new AppError('Este correo electrónico ya está registrado', StatusCodes.CONFLICT);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: first_name,
          last_name:last_name
        },
      },
    });
    if (error) {
      throw new AppError(error.message, error.status);
    }

    return {
      message: "Código de verificación enviado al correo",
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    };
  }
  // 2. verify otp
  async verifyRegistration(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw new AppError(error.message, error.status);

    return {
      user_id: data.user?.id,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    };
  }
  // 3. login user
  async login({ email, password }: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(error.message, error.status);
    }
    return {
      user_id: data.user.id,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  }
  /*-------------------------------------
   *      RESET PASSWORD PROCESS
   *-------------------------------------*/
  // 4. send email to reset password
  async sendPasswordResetEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new AppError(error.message, error.status);
    }
    return { message: "Código de recuperación enviado" };
  }
  // 5. verify password opt
  async verifyResetPasswordOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) throw new AppError(error.message, error.status);
    return {
      user_id: data.user?.id,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }
    };
  }
  // 6. reset password
  async updatePassword(password: string, token: string, refresh_token?: string) {

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refresh_token ?? token,
    });

    if (sessionError) throw new AppError(sessionError.message, sessionError.status);

    const { data, error } = await supabase.auth.updateUser({
      password: password
    });
    if (error) {
      throw new AppError(error.message, error.status);
    }
    return data;
  }
  /*-------------------------------------
   *      RESET REFRESH TOKEN PROCESS
   *-------------------------------------*/
  // 7. refresh session token
  async refreshToken(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken, });
    if (error) {
      throw new AppError(error.message, error.status || StatusCodes.UNAUTHORIZED);
    }
    return {
      user_id: data.user?.id,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    };
  }
  // 8. logout
  async logout(token: string, refresh_token?:string) {
    await supabase.auth.setSession({ 
      access_token: token, 
      refresh_token: token??refresh_token
    });
    const { error } = await supabase.auth.signOut();
    if (error) throw new AppError(error.message, error.status);
    return { message: "Sesión cerrada" };
  }

}