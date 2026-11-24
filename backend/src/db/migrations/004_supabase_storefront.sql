CREATE TABLE public.ocop_gardens (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);

CREATE TABLE public.ocop_catalog (
  id text PRIMARY KEY,
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  slug text NOT NULL UNIQUE,
  batch_code text UNIQUE,
  price_vnd integer NOT NULL CHECK (price_vnd BETWEEN 1000 AND 50000000),
  stock integer NOT NULL CHECK (stock BETWEEN 0 AND 1000000),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX ocop_catalog_producer_idx ON public.ocop_catalog (producer_id);

CREATE TABLE public.ocop_season_logs (
  batch_code text PRIMARY KEY REFERENCES public.ocop_catalog(batch_code),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);

CREATE TABLE public.ocop_seller_memberships (
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, producer_id)
);

CREATE TABLE public.ocop_direct_orders (
  id uuid PRIMARY KEY,
  buyer_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
  customer_name text NOT NULL CHECK (length(trim(customer_name)) BETWEEN 2 AND 100),
  customer_phone text NOT NULL CHECK (customer_phone ~ '^\+?[0-9]{8,15}$'),
  delivery_method text NOT NULL CHECK (delivery_method IN ('pickup','delivery')),
  shipping_address text NOT NULL DEFAULT '' CHECK (length(shipping_address) <= 500),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  subtotal_vnd integer NOT NULL CHECK (subtotal_vnd BETWEEN 1 AND 1000000000),
  shipping_fee_vnd integer NOT NULL CHECK (shipping_fee_vnd IN (0,25000)),
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','confirmed','completed','cancelled')),
  ordered_at timestamptz NOT NULL DEFAULT now(),
  CHECK (delivery_method = 'pickup' OR length(trim(shipping_address)) >= 6)
);
CREATE INDEX ocop_orders_producer_date_idx ON public.ocop_direct_orders (producer_id, ordered_at DESC);
CREATE INDEX ocop_orders_buyer_idx ON public.ocop_direct_orders (buyer_id);

ALTER TABLE public.ocop_gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_season_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_seller_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_direct_orders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ocop_gardens, public.ocop_catalog, public.ocop_season_logs,
  public.ocop_seller_memberships, public.ocop_direct_orders FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ocop_gardens, public.ocop_catalog, public.ocop_season_logs TO anon, authenticated;
GRANT SELECT ON public.ocop_seller_memberships, public.ocop_direct_orders TO authenticated;
GRANT INSERT (id, items, customer_name, customer_phone, delivery_method, shipping_address, note)
  ON public.ocop_direct_orders TO anon, authenticated;
GRANT UPDATE (status) ON public.ocop_direct_orders TO authenticated;

CREATE POLICY ocop_public_gardens ON public.ocop_gardens FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY ocop_public_catalog ON public.ocop_catalog FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY ocop_public_seasons ON public.ocop_season_logs FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ocop_catalog c WHERE c.batch_code = ocop_season_logs.batch_code AND c.active));
CREATE POLICY ocop_own_memberships ON public.ocop_seller_memberships FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY ocop_submit_order ON public.ocop_direct_orders FOR INSERT TO anon, authenticated
  WITH CHECK (buyer_id IS NOT DISTINCT FROM (SELECT auth.uid()) AND status = 'placed');
CREATE POLICY ocop_own_orders ON public.ocop_direct_orders FOR SELECT TO authenticated
  USING (buyer_id = (SELECT auth.uid()) OR producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m));
CREATE POLICY ocop_seller_updates ON public.ocop_direct_orders FOR UPDATE TO authenticated
  USING (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m))
  WITH CHECK (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m));

CREATE FUNCTION public.ocop_price_cart(cart jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  seller text;
  sellers integer;
  item_count integer;
  total bigint;
  lines jsonb;
BEGIN
  IF jsonb_typeof(cart) IS DISTINCT FROM 'array' OR jsonb_array_length(cart) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Giỏ hàng phải có từ 1 đến 30 sản phẩm.' USING ERRCODE = '22023';
  END IF;

  SELECT min(c.producer_id), count(DISTINCT c.producer_id), count(*),
         sum(c.price_vnd::bigint * i.quantity),
         jsonb_agg(jsonb_build_object('productId', c.id, 'sku', c.data->>'sku',
           'title', c.data->>'title', 'quantity', i.quantity, 'unitPriceVnd', c.price_vnd) ORDER BY c.id)
    INTO seller, sellers, item_count, total, lines
    FROM jsonb_to_recordset(cart) AS i("productId" text, quantity integer)
    JOIN public.ocop_catalog c ON c.id = i."productId" AND c.active
    WHERE i.quantity BETWEEN 1 AND 99 AND i.quantity <= c.stock;

  IF item_count <> jsonb_array_length(cart)
     OR (SELECT count(DISTINCT x->>'productId') FROM jsonb_array_elements(cart) x) <> item_count THEN
    RAISE EXCEPTION 'Sản phẩm hết hàng hoặc số lượng trong giỏ không hợp lệ.' USING ERRCODE = '22023';
  END IF;
  IF sellers <> 1 THEN
    RAISE EXCEPTION 'Vui lòng đặt riêng từng nhà vườn.' USING ERRCODE = '22023';
  END IF;
  IF total > 1000000000 THEN
    RAISE EXCEPTION 'Giá trị đơn hàng vượt mức cho phép.' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('producerId', seller, 'subtotalVnd', total, 'items', lines);
END;
$$;

CREATE FUNCTION public.ocop_set_order_totals() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE priced jsonb;
BEGIN
  priced := public.ocop_price_cart(NEW.items);
  NEW.items := priced->'items';
  NEW.producer_id := priced->>'producerId';
  NEW.subtotal_vnd := (priced->>'subtotalVnd')::integer;
  NEW.shipping_fee_vnd := CASE WHEN NEW.delivery_method = 'pickup' THEN 0 ELSE 25000 END;
  IF NEW.delivery_method = 'pickup' THEN NEW.shipping_address := ''; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ocop_set_order_totals BEFORE INSERT ON public.ocop_direct_orders
  FOR EACH ROW EXECUTE FUNCTION public.ocop_set_order_totals();

CREATE FUNCTION public.ocop_place_order(order_id uuid, cart jsonb, buyer_name text, buyer_phone text,
  receive_method text, address text, order_note text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE priced jsonb;
BEGIN
  priced := public.ocop_price_cart(cart);
  INSERT INTO public.ocop_direct_orders (id, items, customer_name, customer_phone, delivery_method, shipping_address, note)
    VALUES (order_id, cart, trim(buyer_name), regexp_replace(buyer_phone, '[ .-]', '', 'g'),
      receive_method, trim(coalesce(address,'')), trim(coalesce(order_note,'')));
  RETURN priced || jsonb_build_object('id', order_id, 'orderCode', 'OCOP-' || upper(left(replace(order_id::text,'-',''), 12)),
    'shippingFeeVnd', CASE WHEN receive_method = 'pickup' THEN 0 ELSE 25000 END);
END;
$$;

REVOKE ALL ON FUNCTION public.ocop_price_cart(jsonb), public.ocop_set_order_totals(),
  public.ocop_place_order(uuid,jsonb,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ocop_price_cart(jsonb),
  public.ocop_place_order(uuid,jsonb,text,text,text,text,text) TO anon, authenticated;
