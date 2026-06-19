import { PrismaClient, ControlStatus, NivelControl, CriticidadControl } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de ejemplo...');

  // 0. Crear usuario admin por defecto
  const adminEmail = 'admin@vasochain.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nombre: 'Administrador VasoChain',
        rol: 'admin',
      },
    });
    console.log('✅ Usuario admin creado');
  }

  // 1. Crear categorías para el sistema de gestión existente (o buscar si ya existen
  const nombresCategorias = [
    { nombre: 'Validación de Entregas', descripcion: 'Controles relacionados con la verificación y validación de entregas', orden: 1 },
    { nombre: 'Registro en Blockchain', descripcion: 'Controles para el registro y verificación en la blockchain', orden: 2 },
    { nombre: 'Gestión de Beneficiarios', descripcion: 'Controles relacionados con la administración de beneficiarios', orden: 3 },
    { nombre: 'Seguridad y Auditoría', descripcion: 'Controles de seguridad, acceso y auditoría del sistema', orden: 4 },
  ];
  const categorias = [];
  for (const catData of nombresCategorias) {
    let cat = await prisma.controlCategory.findUnique({
      where: { nombre: catData.nombre },
    });
    if (!cat) {
      cat = await prisma.controlCategory.create({
        data: catData,
      });
    }
    categorias.push(cat);
  }

  console.log('✅ Categorías listas');

  // 2. Crear controles de ejemplo para el sistema de gestión
  const controles = [
    {
      identificador: 'CTRL-VAL-001',
      descripcion: 'Verificar que la foto de entrega sea clara y muestre al beneficiario',
      categoriaId: categorias[0].id,
      estado: ControlStatus.PRODUCCION,
      esFrecuente: true,
      orden: 1,
    },
    {
      identificador: 'CTRL-VAL-002',
      descripcion: 'Validar que el código QR escaneado corresponda al beneficiario',
      categoriaId: categorias[0].id,
      estado: ControlStatus.PRODUCCION,
      esFrecuente: true,
      orden: 2,
    },
    {
      identificador: 'CTRL-VAL-003',
      descripcion: 'Confirmar que la entrega se realice dentro del horario establecido',
      categoriaId: categorias[0].id,
      estado: ControlStatus.VALIDADO,
      esFrecuente: false,
      orden: 3,
    },
    {
      identificador: 'CTRL-BCH-001',
      descripcion: 'Asegurar que el hash de la entrega se registre correctamente en blockchain',
      categoriaId: categorias[1].id,
      estado: ControlStatus.PRODUCCION,
      esFrecuente: true,
      orden: 1,
    },
    {
      identificador: 'CTRL-BCH-002',
      descripcion: 'Verificar la confirmación de la transacción en la red blockchain',
      categoriaId: categorias[1].id,
      estado: ControlStatus.EN_PRUEBAS,
      esFrecuente: false,
      orden: 2,
    },
    {
      identificador: 'CTRL-BEN-001',
      descripcion: 'Validar que el DNI del beneficiario sea único y válido',
      categoriaId: categorias[2].id,
      estado: ControlStatus.PRODUCCION,
      esFrecuente: true,
      orden: 1,
    },
    {
      identificador: 'CTRL-BEN-002',
      descripcion: 'Verificar que el beneficiario esté activo en el sistema',
      categoriaId: categorias[2].id,
      estado: ControlStatus.VALIDADO,
      esFrecuente: false,
      orden: 2,
    },
    {
      identificador: 'CTRL-BEN-003',
      descripcion: 'Confirmar que el club de madres esté registrado correctamente',
      categoriaId: categorias[2].id,
      estado: ControlStatus.BORRADOR,
      esFrecuente: false,
      orden: 3,
    },
    {
      identificador: 'CTRL-SEG-001',
      descripcion: 'Auditar todos los accesos a la sección de gestión de controles',
      categoriaId: categorias[3].id,
      estado: ControlStatus.PRODUCCION,
      esFrecuente: false,
      orden: 1,
    },
    {
      identificador: 'CTRL-SEG-002',
      descripcion: 'Verificar que solo usuarios autorizados puedan aprobar controles',
      categoriaId: categorias[3].id,
      estado: ControlStatus.APROBADO,
      esFrecuente: false,
      orden: 2,
    },
  ];

  for (const control of controles) {
    await prisma.control.upsert({
      where: { identificador: control.identificador },
      update: {},
      create: control,
    });
  }

  console.log('✅ Controles de gestión listos');

  // 3. Crear los 13 controles de "arnés" Lean Startup
  const harnessControles = [
    // Nivel 1 - ENTRADA
    {
      id: 1,
      identificador: 'HC-001',
      descripcion: 'Validación QR (crítica) → ¿Es beneficiario en padrón?',
      nivel: NivelControl.NIVEL_1_ENTRADA,
      criticidad: CriticidadControl.CRITICA,
      estado: true,
      orden: 1,
    },
    {
      id: 2,
      identificador: 'HC-002',
      descripcion: 'Geolocalización (media) → ¿Está en punto de distribución?',
      nivel: NivelControl.NIVEL_1_ENTRADA,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 2,
    },
    {
      id: 3,
      identificador: 'HC-003',
      descripcion: 'Fecha/Hora (media) → ¿Horario válido 8am-6pm?',
      nivel: NivelControl.NIVEL_1_ENTRADA,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 3,
    },
    // Nivel 2 - FOTO
    {
      id: 4,
      identificador: 'HC-004',
      descripcion: 'IA validación (crítica) → ¿Contiene evidencia de alimentos?',
      nivel: NivelControl.NIVEL_2_FOTO,
      criticidad: CriticidadControl.CRITICA,
      estado: true,
      orden: 4,
    },
    {
      id: 5,
      identificador: 'HC-005',
      descripcion: 'Integridad EXIF (media) → ¿Foto no modificada?',
      nivel: NivelControl.NIVEL_2_FOTO,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 5,
    },
    {
      id: 6,
      identificador: 'HC-006',
      descripcion: 'Face recognition (baja) → ¿Se ve al beneficiario? (opcional)',
      nivel: NivelControl.NIVEL_2_FOTO,
      criticidad: CriticidadControl.BAJA,
      estado: true,
      orden: 6,
    },
    // Nivel 3 - DATOS
    {
      id: 7,
      identificador: 'HC-007',
      descripcion: 'Consistencia (media) → ¿Datos coinciden con padrón?',
      nivel: NivelControl.NIVEL_3_DATOS,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 7,
    },
    {
      id: 8,
      identificador: 'HC-008',
      descripcion: 'Frecuencia (media) → ¿Entregas múltiples en 24h?',
      nivel: NivelControl.NIVEL_3_DATOS,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 8,
    },
    {
      id: 9,
      identificador: 'HC-009',
      descripcion: 'QR vigente (baja) → ¿QR no vencido (30 días)?',
      nivel: NivelControl.NIVEL_3_DATOS,
      criticidad: CriticidadControl.BAJA,
      estado: true,
      orden: 9,
    },
    // Nivel 4 - BLOCKCHAIN
    {
      id: 10,
      identificador: 'HC-010',
      descripcion: 'Sello en cadena (crítica) → ¿Registrado inmutablemente?',
      nivel: NivelControl.NIVEL_4_BLOCKCHAIN,
      criticidad: CriticidadControl.CRITICA,
      estado: true,
      orden: 10,
    },
    {
      id: 11,
      identificador: 'HC-011',
      descripcion: 'Confirmación bloque (media) → ¿Bloque confirmado?',
      nivel: NivelControl.NIVEL_4_BLOCKCHAIN,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 11,
    },
    // Nivel 5 - SUPERVISIÓN
    {
      id: 12,
      identificador: 'HC-012',
      descripcion: 'Alertas (media) → ¿Dashboard de alertas?',
      nivel: NivelControl.NIVEL_5_SUPERVISION,
      criticidad: CriticidadControl.MEDIA,
      estado: true,
      orden: 12,
    },
    {
      id: 13,
      identificador: 'HC-013',
      descripcion: 'Auditoría muestreo (baja) → ¿5% verificadas manualmente?',
      nivel: NivelControl.NIVEL_5_SUPERVISION,
      criticidad: CriticidadControl.BAJA,
      estado: true,
      orden: 13,
    },
  ];

  for (const hc of harnessControles) {
    // Usar upsert para crear o actualizar el control con su métrica
    await prisma.harnessControl.upsert({
      where: { id: hc.id },
      update: {},
      create: {
        ...hc,
        controlMetric: {
          create: {},
        },
      },
    });
  }

  console.log('✅ 13 Controles de "arnés" listos');

  // 4. Crear documentación de ejemplo si no existe
  const primerControl = await prisma.control.findFirst({
    where: { identificador: 'CTRL-VAL-001' },
  });

  if (primerControl) {
    const docExists = await prisma.documentation.findFirst({
      where: { controlId: primerControl.id },
    });

    if (!docExists) {
      await prisma.documentation.create({
        data: {
          controlId: primerControl.id,
          tipoDocumento: 'Procedimiento',
          titulo: 'Procedimiento de Validación de Fotos',
          contenido:
            '1. Abrir la foto de entrega\n2. Verificar que el beneficiario sea visible\n3. Confirmar que el entorno sea adecuado\n4. Aprobar o rechazar la entrega',
          version: '1.0',
          creadoPor: 'Sistema',
        },
      });
    }
  }

  console.log('✅ Documentación lista');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
