# Al-Qa’im — Testing Checklist

Run through this before considering a release done. Check each box.

## Customer — storefront

- [ ] Homepage renders; the 3D hero rotates shoes inside the gold rings, and the pause button stops it
- [ ] With reduced motion (Windows "Show animations" off) the hero cross-fades in place instead of flying
- [ ] No double/ghosted shoe while the hero loads; the "Now showing" chip links to the product
- [ ] Popular category pills re-query the catalogue via `?popular=` and keep the URL shareable
- [ ] New Arrivals show real products with prices/ratings
- [ ] Shop: category filter works and updates `?category=`; a department includes its categories
- [ ] Shop: sizes offered match the section (S–XXL in Shirts, 28–38 in Trousers)
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
- [ ] Checkout as a guest redirects to login, and returns to checkout after signing in
- [ ] The guest basket is still there after signing in
- [ ] An order placed as a guest appears under My orders after signing in with the same email (any capitalisation)
- [ ] "Continue with Google" signs in, creates the customer, and lands on the right page (only when configured)
- [ ] A Google account can set a password in Account → Profile, then sign in with email too
- [ ] Login / logout work
- [ ] Checkout requires a size-selected variant in cart
- [ ] Place COD order → success page shows order number
- [ ] Order appears in `/account/orders`
- [ ] Order detail shows items, totals, address, status
- [ ] Product stock decreased by the ordered quantity
- [ ] Wishlist add/remove works
- [ ] Address add/delete works; first address is default
- [ ] Profile: name update + password change (with current-password check)
- [ ] Contact form submits and appears in Admin → Messages
- [ ] Login with `?next=/account/wishlist` returns there after signing in
- [ ] A customer with a DELIVERED order can review that product; the review waits for approval

## Admin

- [ ] Non-admin (CUSTOMER) is redirected away from `/admin`
- [ ] Dashboard metrics reflect real data
- [ ] Product create / edit / publish / delete
- [ ] Editing a price shows on the storefront
- [ ] Marking New Arrival / Weekly Pick affects the homepage
- [ ] Category create / activate / delete (blocked if it has products or sub-categories)
- [ ] New category inside a department (e.g. Clothing › Shirts) appears in the menu, homepage tiles and filter only once it has a published product
- [ ] Brands: add, hide from filter, reorder, delete (products keep selling without a brand)
- [ ] Shop filters: switching a group off removes it from the shop sidebar; order is respected
- [ ] New product → Create & continue → add photo, colours, sizes and stock → checklist all green → publish → buyable
- [ ] One-size product (no sizes) can be added to cart without choosing a size
- [ ] Removing a size that has been ordered is refused with an explanation
- [ ] Deleting a product that has been ordered unpublishes it instead
- [ ] Category edit: photo, description and SEO save; toggling Active keeps the SEO fields
- [ ] Messages: mark read/unread, reply opens the mail client, delete
- [ ] Inventory: set stock; low/out badges update
- [ ] Orders: change status; Cancelled/Refunded returns stock exactly once (double-click safe)
- [ ] Reopening a cancelled order is refused if the stock has since sold
- [ ] Orders: set tracking + internal notes
- [ ] Reviews: approve → appears on the PDP; reject/delete
- [ ] Coupons: create/toggle/delete
- [ ] Homepage CMS: edit hero → storefront updates
- [ ] Banners: create (with image), schedule, toggle, delete
- [ ] SEO: per-page save
- [ ] Settings: save store config; uploading a logo replaces the mark in header, footer and admin
- [ ] Users: change role; can't demote last super admin; a demoted admin loses access immediately
- [ ] An EDITOR only sees Products / Categories / Inventory / Homepage / Banners in the sidebar
- [ ] Activity log records the above actions
- [ ] Image upload to Supabase works (once bucket + keys are set)

## Security (attempt these — all should be blocked/handled)

- [ ] Visit `/admin/*` while logged out → redirected to login
- [ ] Visit `/admin/*` as CUSTOMER → redirected
- [ ] Open another user's order by ID at `/account/orders/[id]` → 404
- [ ] Tamper with cart quantity beyond stock → server rejects at checkout
- [ ] Apply an expired/invalid coupon → rejected server-side
- [ ] Upload a non-image or >5MB file → rejected (also an HTML file renamed to .jpg)
- [ ] Paste an image URL from an unapproved host in the admin → refused with a clear message
- [ ] 9 wrong passwords for one account in 15 minutes → further attempts refused
- [ ] Rapid contact-form / coupon / registration submissions → "Too many attempts"
- [ ] `/login?next=//evil.example` → lands on /account, not off-site
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
