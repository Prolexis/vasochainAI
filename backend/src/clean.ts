import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Eliminando todos los registros de beneficiarios y entregas...');
  const deletedEntregas = await prisma.entrega.deleteMany();
  console.log(`🗑️ Entregas eliminadas: ${deletedEntregas.count}`);
  
  const deletedBeneficiarios = await prisma.beneficiario.deleteMany();
  console.log(`🗑️ Beneficiarios eliminados: ${deletedBeneficiarios.count}`);
  
  console.log('✨ Base de datos lista para registrar nuevos beneficiarios realistas.');
}

main()
  .catch((e) => {
    console.error('❌ Error al vaciar registros:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
