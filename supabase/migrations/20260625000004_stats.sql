-- ============================================================
-- Daily message counts (fills zeros for days with no activity)
-- ============================================================
create or replace function get_daily_message_counts(days_back int default 30)
returns table (day date, count bigint)
language sql stable
as $$
  select
    d::date as day,
    coalesce(m.cnt, 0) as count
  from generate_series(
    (current_date - (days_back - 1) * '1 day'::interval)::date,
    current_date,
    '1 day'::interval
  ) as d
  left join (
    select created_at::date as msg_date, count(*) as cnt
    from chat_messages
    where role = 'user'
      and created_at >= current_date - (days_back - 1) * '1 day'::interval
    group by msg_date
  ) m on m.msg_date = d::date
  order by d asc
$$;


-- ============================================================
-- Top Q&A pairs by successful match count
-- ============================================================
create or replace function get_top_qa_pairs(limit_n int default 10)
returns table (
  id        uuid,
  question  text,
  category  text,
  is_active boolean,
  hit_count bigint
)
language sql stable
as $$
  select
    q.id,
    q.question,
    q.category,
    q.is_active,
    count(m.id)::bigint as hit_count
  from qa_pairs q
  join chat_messages m
    on m.matched_qa_id = q.id
    and m.role = 'assistant'
  group by q.id, q.question, q.category, q.is_active
  order by hit_count desc
  limit limit_n
$$;
