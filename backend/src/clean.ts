import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando entregas, alertas y beneficiarios...');

  // 1. Eliminar alertas y ejecuciones de controles asociadas
  const deletedAlertas = await prisma.alerta.deleteMany();
  console.log(`🗑️ Alertas eliminadas: ${deletedAlertas.count}`);

  const deletedRuns = await prisma.controlRun.deleteMany();
  console.log(`🗑️ Control runs eliminados: ${deletedRuns.count}`);

  // 2. Eliminar entregas
  const deletedEntregas = await prisma.entrega.deleteMany();
  console.log(`🗑️ Entregas eliminadas: ${deletedEntregas.count}`);

  // 3. Eliminar beneficiarios
  const deletedBeneficiarios = await prisma.beneficiario.deleteMany();
  console.log(`🗑️ Beneficiarios eliminados: ${deletedBeneficiarios.count}`);

  console.log('✨ Base de datos de entregas y beneficiarios vaciada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error al vaciar registros:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
