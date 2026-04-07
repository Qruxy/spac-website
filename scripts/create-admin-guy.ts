import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider'

const prisma = new PrismaClient()

const USER_POOL_ID = 'us-east-1_L6YMqSeqa'
const EMAIL = 'mileslegionis@verizon.net'
const PASSWORD = 'Augustus14@'
const FIRST_NAME = 'Guy'
const LAST_NAME = 'Miles' // SPAC Editor/VP

async function main() {
  console.log('Creating admin account for Guy...')

  // 1. Hash password
  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  console.log('Password hashed.')

  // 2. Upsert in Prisma/Supabase
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      role: 'ADMIN',
      isValidated: true,
      passwordHash,
    },
    update: {
      role: 'ADMIN',
      isValidated: true,
      passwordHash,
    },
  })
  console.log('DB user upserted:', user.id)

  // 3. Cognito
  const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' })

  try {
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: EMAIL,
      TemporaryPassword: PASSWORD + '_tmp',
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: EMAIL },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: FIRST_NAME },
        { Name: 'family_name', Value: LAST_NAME },
      ],
    }))
    console.log('Cognito user created.')
  } catch (err: any) {
    if (err.name === 'UsernameExistsException') {
      console.log('Cognito user already exists, continuing.')
    } else {
      throw err
    }
  }

  // Set permanent password
  await cognito.send(new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: EMAIL,
    Password: PASSWORD,
    Permanent: true,
  }))
  console.log('Cognito password set permanently.')

  // Add to admins group
  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: EMAIL,
    GroupName: 'admins',
  }))
  console.log('Added to admins group.')

  console.log('\n✅ Done. Guy can log in at https://www.stpeteastronomyclub.org/login')
  console.log(`   Email: ${EMAIL}`)
  console.log(`   Password: ${PASSWORD}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
