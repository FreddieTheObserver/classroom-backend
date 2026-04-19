import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
        process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash, role: "ADMIN" },
        create: {
            email,
            passwordHash,
            name: "Administrator",
            role: "ADMIN",
        },
    });
    console.log(`[seed] admin ready: ${user.email} (id=${user.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect())