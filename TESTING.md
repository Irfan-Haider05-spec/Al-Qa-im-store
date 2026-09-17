# Shoe Express — Testing Checklist

Run through this before considering a release done. Check each box.

## Customer — storefront

- [ ] Homepage renders; hero animation cycles (and is static with reduced motion)
- [ ] Popular category pills link to category pages
- [ ] New Arrivals show real products with prices/ratings
- [ ] Shop: category filter works and updates `?category=`
- [ ] Shop: gender / price / sale filters work
- [ ] Shop: sort (featured/newest/price/rating) works
- [ ] Shop: pagination works
- [ ] Product detail: gallery + thumbnails switch
- [ ] Product detail: selecting colour filters available sizes
- [ ] Product detail: out-of-stock sizes are disabled
- [ ] Add to cart shows the live cart count in the header
- [ ] Cart: update quantity / remove works; totals recompute
- [ ] Cart: free-shipping threshold message appears/disappears correctly

## Customer — auth & checkout

- [ ] Register creates an account and auto-logs in
- [ ] Login / logout work
- [ ] Checkout requires a size-selected variant in cart
- [ ] Place COD order → success page shows order number
- [ ] Order appears in `/account/orders`
- [ ] Order detail shows items, totals, address, status
- [ ] Product stock decreased by the ordered quantity
- [ ] Wishlist add/remove works
- [ ] Address add/delete works; first address is default
- [ ] Profile: name update + password change (with current-password check)
- [ ] Contact form submits (message stored)

## Admin

- [ ] Non-admin (CUSTOMER) is redirected away from `/admin`
- [ ] Dashboard metrics reflect real data
- [ ] Product create / edit / publish / delete
- [ ] Editing a price shows on the storefront
- [ ] Marking New Arrival / Weekly Pick affects the homepage
- [ ] Category create / activate / delete (blocked if it has products)
- [ ] Inventory: set stock; low/out badges update
- [ ] Orders: change status; Cancelled/Refunded returns stock
- [ ] Orders: set tracking + internal notes
- [ ] Reviews: approve → appears on the PDP; reject/delete
- [ ] Coupons: create/toggle/delete
- [ ] Homepage CMS: edit hero → storefront updates
- [ ] Banners: create (with image), schedule, toggle, delete
- [ ] SEO: per-page save
- [ ] Settings: save store config
- [ ] Users: change role; can't demote last super admin
- [ ] Activity log records the above actions
- [ ] Image upload to Supabase works (once bucket + keys are set)

## Security (attempt these — all should be blocked/handled)

- [ ] Visit `/admin/*` while logged out → redirected to login
- [ ] Visit `/admin/*` as CUSTOMER → redirected
- [ ] Open another user's order by ID at `/account/orders/[id]` → 404
- [ ] Tamper with cart quantity beyond stock → server rejects at checkout
- [ ] Apply an expired/invalid coupon → rejected server-side
- [ ] Upload a non-image or >5MB file → rejected
- [ ] Order totals always recomputed server-side (client values ignored)

## SEO / performance

- [ ] `/sitemap.xml` lists products + categories
- [ ] `/robots.txt` disallows /admin, /account, /cart, /checkout, /api
- [ ] Product pages have canonical + OG tags + Product JSON-LD
- [ ] No public page has an accidental `noindex`
- [ ] Lighthouse: check performance/accessibility/SEO scores
- [ ] Images use next/image and don't distort

## Responsive (test each breakpoint)

- [ ] 320 / 375 / 390 / 768 / 1024 / 1280 / 1440 / 1920
- [ ] Mobile nav drawer opens/closes, closes on navigation
- [ ] Hero, product grid, filters, cart, checkout, admin usable on mobile

## Accessibility

- [ ] Skip-to-content link works (Tab on load)
- [ ] Keyboard navigation through nav, filters, forms
- [ ] Visible focus states
- [ ] Images have alt text
- [ ] Reduced-motion disables non-essential animation
