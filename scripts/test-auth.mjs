import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Test with your email
    const email = 'yaseerarafat230@gmail.com';
    const password = 'test123'; // You'll need to provide the actual password
    
    console.log(`Testing login for: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        password: true,
      }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      hasPassword: !!user.password
    });
    
    // Test password verification (you'll need to provide the actual password)
    if (user.password) {
      const isValidPassword = bcrypt.compareSync(password, user.password);
      console.log('Password valid:', isValidPassword);
      
      if (isValidPassword) {
        console.log('Authentication successful!');
        console.log('User should be able to access admin routes');
      } else {
        console.log('Password is incorrect');
      }
    } else {
      console.log('User has no password (OAuth user)');
    }
    
  } catch (error) {
    console.error('Error testing auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 