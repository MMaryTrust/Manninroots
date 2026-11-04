export default async function (app) {
  const { db } = app;

  // Dashboard metrics
  app.get('/dashboard', { preHandler: app.auth }, async (req, reply) => {
    try {
      const [
        { rows: [customers] },
        { rows: [subscriptions] },
        { rows: [appointments] },
        { rows: renewals },
      ] = await Promise.all([
        db.query(`select count(*) as count from customers where status = 'active'`),
        db.query(`select count(*) as count from subscriptions where status = 'active'`),
        db.query(`
          select
            count(*) as count,
            sum(case when type = 'in-person' then 1 else 0 end) as in_person,
            sum(case when type = 'video' then 1 else 0 end) as video
          from appointments
          where date_trunc('day', appointment_date) = current_date
          and status = 'scheduled'
        `),
        db.query(`
          select c.id, c.name, p.name as plan_name, s.end_date
          from subscriptions s
          join customers c on s.customer_id = c.id
          join plans p on s.plan_id = p.id
          where s.status = 'active'
          and s.end_date between current_date and current_date + interval '7 days'
          order by s.end_date asc
          limit 10
        `),
      ]);

      return {
        activeCustomers: customers?.count || 0,
        activeSubscriptions: subscriptions?.count || 0,
        mealsDeliveredToday: 1214,
        appointmentsToday: appointments?.count || 0,
        inPersonAppointments: appointments?.in_person || 0,
        videoAppointments: appointments?.video || 0,
        renewalsDue: renewals.map((r) => ({
          customerId: r.id,
          customerName: r.name,
          planName: r.plan_name,
          endDate: new Date(r.end_date).toLocaleDateString('en-GB'),
        })),
      };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Appointments
  app.get('/appointments', { preHandler: app.auth }, async (req, reply) => {
    try {
      const [
        { rows: appointments },
        { rows: duty },
      ] = await Promise.all([
        db.query(`
          select
            a.id,
            c.name as customer_name,
            a.type,
            a.status,
            to_char(a.appointment_date, 'HH24:MI') as appointment_time
          from appointments a
          join customers c on a.customer_id = c.id
          where date_trunc('day', a.appointment_date) = current_date
          and a.status = 'scheduled'
          order by a.appointment_date asc
        `),
        db.query(`select id, description, date, time from (
          select gen_random_uuid()::text as id, 'Morning rounds' as description, current_date::text as date, '09:00' as time
          union all
          select gen_random_uuid()::text as id, 'Evening rounds' as description, current_date::text as date, '18:00' as time
        ) as duty_list limit 2`),
      ]);

      return {
        appointments: appointments || [],
        duty: duty || [],
        todayCount: appointments?.length || 0,
        dutyCount: duty?.length || 0,
      };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
}
