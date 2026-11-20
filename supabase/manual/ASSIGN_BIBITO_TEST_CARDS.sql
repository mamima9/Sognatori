-- TEST BIBITO: assegna le 21 carte 001/002 e completa l'album artwork 64/64.
-- Eseguire una sola volta nel Supabase SQL Editor del progetto Sognatori.
-- La transazione si interrompe se una delle 21 copie risulta già assegnata a un altro account.

begin;

do $$
declare
  v_user uuid;
  v_updated integer;
begin
  select id into v_user
  from auth.users
  where lower(email) = lower('bibitoeuro@gmail.com');

  if v_user is null then
    raise exception 'Account Bibito non trovato in auth.users';
  end if;

  -- 21 copie di test: 001 e 002 per Adli e Aragostino, 001 per gli altri.
  update public.sognatore_card_instances i
  set owner_id = v_user
  where (i.card_id, i.serial_number) in (
    ('adlimago',1), ('adlimago',2),
    ('cenere',1),
    ('ring-ape',1),
    ('toasty',1),
    ('nina',1),
    ('sparkly',1),
    ('taomarco',1),
    ('aragostino',1), ('aragostino',2),
    ('cancucc',1),
    ('cillymbu',1),
    ('deb',1),
    ('dragociocco',1),
    ('eroe',1),
    ('fierononno',1),
    ('long',1),
    ('nuvobetta',1),
    ('scroccospell',1),
    ('spinoff',1),
    ('uesditti',1)
  )
  and (i.owner_id is null or i.owner_id = v_user);

  get diagnostics v_updated = row_count;
  if v_updated <> 21 then
    raise exception 'Assegnate solo % di 21 copie: controllo proprietario/seriali fallito. Nessuna modifica sarà salvata.', v_updated;
  end if;

  -- Sblocca tutti i 64 artwork di default per provare subito il premio di Adli.
  insert into public.sognatore_arabnite_progress(user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  update public.sognatore_arabnite_progress
  set discovered_artwork_ids = array(
        select card_id
        from public.sognatore_card_definitions
        order by display_order
      ),
      adli_reward_claimed = false,
      updated_at = now()
  where user_id = v_user;
end $$;

commit;

-- Verifica finale: 21 carte possedute e 64 artwork sbloccati.
select
  (select count(*) from public.sognatore_card_instances where owner_id = (select id from auth.users where lower(email)=lower('bibitoeuro@gmail.com'))) as carte_possedute_totali,
  (select cardinality(discovered_artwork_ids) from public.sognatore_arabnite_progress where user_id = (select id from auth.users where lower(email)=lower('bibitoeuro@gmail.com'))) as artwork_sbloccati;
