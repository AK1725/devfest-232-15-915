/* Bilingual strings — every user-visible label lives here.
   Nothing in the UI is written directly in one language. */

const I18N = {
  en: {
    html_lang: "en",

    app_title: "Tender Package Builder",
    app_sub: "Check, order and merge your tender documents",

    s1_title: "Load the tender requirements",
    s1_sub: "Open the requirements.json file supplied with the tender.",
    s1_drop: "Drop requirements.json here, or click to choose",
    s1_hint: "JSON file only",

    s2_title: "Upload your PDF documents",
    s2_sub: "Up to 30 PDF files, 50 MB in total. Nothing leaves your computer.",
    s2_drop: "Drop PDF files here, or click to choose",
    s2_hint: "PDF files only",
    s2_files: "Uploaded files",

    s3_title: "Match documents and check status",
    s3_sub: "Match one file to each requirement and enter expiry dates where asked.",

    s4_title: "Generate the package",
    s4_sub: "One combined PDF with a cover page and page footers.",
    opt_index: "Add an index page after the cover (optional)",
    generate: "Generate and download package",
    export_csv: "Export checklist (CSV)",

    auto_match: "Auto-match by file name",
    clear_all: "Remove all",

    tender_details: "Tender details",
    t_id: "Tender ID",
    t_title: "Title",
    t_entity: "Procuring entity",
    t_bidder: "Bidder",
    t_deadline: "Submission deadline",
    t_docs: "Required documents",

    st_ok: "OK",
    st_missing: "Missing",
    st_expiry_needed: "Expiry date needed",
    st_expired: "Expired",
    st_not_provided: "Not provided",

    tag_mandatory: "Mandatory",
    tag_optional: "Optional",
    tag_expiry: "Has expiry",

    select_file: "— No file matched —",
    expiry_label: "Expiry date",
    expiry_na: "Not applicable",

    pages: "pages",
    page_one: "page",
    dupe: "Duplicate",
    dupe_of: "Same content as",
    matched_to: "Matched to",
    remove_file: "Remove file",

    blockers_title: "The package cannot be generated yet",
    b_missing: "is mandatory but has no file matched.",
    b_expiry_needed: "needs an expiry date.",
    b_expired: "expired before the submission deadline.",

    err_not_pdf: "is not a PDF file and was rejected.",
    err_bad_pdf: "could not be read. It may be damaged or password-protected.",
    err_too_many: "Too many files. The limit is 30 PDF files.",
    err_too_big: "Total size is over the 50 MB limit.",
    err_bad_json: "That file is not valid requirements JSON.",
    err_json_shape: "The JSON is missing a tender or requirements section.",

    ok_json_loaded: "Requirements loaded.",
    ok_files_added: "file(s) added.",
    ok_generated: "Package created and downloaded.",
    ok_automatch: "match(es) suggested from file names.",
    ok_csv: "Checklist exported.",
    none_automatch: "No new matches could be suggested from the file names.",

    generating: "Building the package…",
    gen_done: "Done — your package has been downloaded.",
    gen_fail: "Could not build the package:",

    sum_ok: "ready",
    sum_blocking: "blocking",
    sum_optional: "optional, not provided",

    cover_title: "TENDER DOCUMENT PACKAGE",
    cover_generated: "Package created on",
    cover_contents: "Documents included in this package",
    index_title: "INDEX",
    index_doc: "Document",
    index_page: "Starts on page",

    csv_doc: "Document",
    csv_file: "File name",
    csv_pages: "Pages",
    csv_expiry: "Expiry date",
    csv_status: "Status",

    foot_privacy: "All files are processed inside your browser. Nothing is uploaded anywhere."
  },

  bn: {
    html_lang: "bn",

    app_title: "টেন্ডার প্যাকেজ বিল্ডার",
    app_sub: "আপনার টেন্ডার নথি যাচাই, সাজানো ও একত্র করুন",

    s1_title: "টেন্ডারের শর্ততালিকা লোড করুন",
    s1_sub: "টেন্ডারের সাথে দেওয়া requirements.json ফাইলটি খুলুন।",
    s1_drop: "requirements.json এখানে ছাড়ুন, অথবা ক্লিক করে বেছে নিন",
    s1_hint: "শুধুমাত্র JSON ফাইল",

    s2_title: "আপনার পিডিএফ নথি আপলোড করুন",
    s2_sub: "সর্বোচ্চ ৩০টি পিডিএফ ফাইল, মোট ৫০ মেগাবাইট। কোনো ফাইল আপনার কম্পিউটার ছেড়ে যায় না।",
    s2_drop: "পিডিএফ ফাইল এখানে ছাড়ুন, অথবা ক্লিক করে বেছে নিন",
    s2_hint: "শুধুমাত্র পিডিএফ ফাইল",
    s2_files: "আপলোড করা ফাইল",

    s3_title: "নথি মেলান ও অবস্থা যাচাই করুন",
    s3_sub: "প্রতিটি শর্তের সাথে একটি ফাইল মেলান এবং প্রয়োজনে মেয়াদ শেষের তারিখ দিন।",

    s4_title: "প্যাকেজ তৈরি করুন",
    s4_sub: "প্রচ্ছদ পাতা ও পৃষ্ঠা ফুটারসহ একটি সম্মিলিত পিডিএফ।",
    opt_index: "প্রচ্ছদের পরে একটি সূচিপত্র যোগ করুন (ঐচ্ছিক)",
    generate: "প্যাকেজ তৈরি করে ডাউনলোড করুন",
    export_csv: "চেকলিস্ট রপ্তানি করুন (CSV)",

    auto_match: "ফাইলের নাম দেখে স্বয়ংক্রিয় মেলানো",
    clear_all: "সব সরান",

    tender_details: "টেন্ডারের বিবরণ",
    t_id: "টেন্ডার আইডি",
    t_title: "শিরোনাম",
    t_entity: "ক্রয়কারী প্রতিষ্ঠান",
    t_bidder: "দরদাতা",
    t_deadline: "জমাদানের শেষ তারিখ",
    t_docs: "প্রয়োজনীয় নথি",

    st_ok: "ঠিক আছে",
    st_missing: "অনুপস্থিত",
    st_expiry_needed: "মেয়াদের তারিখ প্রয়োজন",
    st_expired: "মেয়াদোত্তীর্ণ",
    st_not_provided: "দেওয়া হয়নি",

    tag_mandatory: "আবশ্যিক",
    tag_optional: "ঐচ্ছিক",
    tag_expiry: "মেয়াদ আছে",

    select_file: "— কোনো ফাইল মেলানো হয়নি —",
    expiry_label: "মেয়াদ শেষের তারিখ",
    expiry_na: "প্রযোজ্য নয়",

    pages: "পৃষ্ঠা",
    page_one: "পৃষ্ঠা",
    dupe: "একই ফাইল",
    dupe_of: "একই বিষয়বস্তু",
    matched_to: "মেলানো হয়েছে",
    remove_file: "ফাইল সরান",

    blockers_title: "এখনো প্যাকেজ তৈরি করা যাচ্ছে না",
    b_missing: "আবশ্যিক, কিন্তু কোনো ফাইল মেলানো হয়নি।",
    b_expiry_needed: "এর মেয়াদ শেষের তারিখ দিতে হবে।",
    b_expired: "জমাদানের শেষ তারিখের আগেই মেয়াদোত্তীর্ণ।",

    err_not_pdf: "পিডিএফ ফাইল নয়, তাই বাতিল করা হয়েছে।",
    err_bad_pdf: "পড়া যায়নি। ফাইলটি নষ্ট বা পাসওয়ার্ড দিয়ে সুরক্ষিত হতে পারে।",
    err_too_many: "অনেক বেশি ফাইল। সর্বোচ্চ ৩০টি পিডিএফ ফাইল দেওয়া যাবে।",
    err_too_big: "মোট আকার ৫০ মেগাবাইটের সীমা ছাড়িয়ে গেছে।",
    err_bad_json: "এই ফাইলটি বৈধ requirements JSON নয়।",
    err_json_shape: "JSON ফাইলে tender বা requirements অংশ নেই।",

    ok_json_loaded: "শর্ততালিকা লোড হয়েছে।",
    ok_files_added: "টি ফাইল যোগ হয়েছে।",
    ok_generated: "প্যাকেজ তৈরি ও ডাউনলোড হয়েছে।",
    ok_automatch: "টি মিল প্রস্তাব করা হয়েছে।",
    ok_csv: "চেকলিস্ট রপ্তানি হয়েছে।",
    none_automatch: "ফাইলের নাম থেকে নতুন কোনো মিল পাওয়া যায়নি।",

    generating: "প্যাকেজ তৈরি হচ্ছে…",
    gen_done: "সম্পন্ন — আপনার প্যাকেজ ডাউনলোড হয়েছে।",
    gen_fail: "প্যাকেজ তৈরি করা যায়নি:",

    sum_ok: "প্রস্তুত",
    sum_blocking: "বাধা",
    sum_optional: "ঐচ্ছিক, দেওয়া হয়নি",

    cover_title: "TENDER DOCUMENT PACKAGE",
    cover_generated: "Package created on",
    cover_contents: "Documents included in this package",
    index_title: "INDEX",
    index_doc: "Document",
    index_page: "Starts on page",

    csv_doc: "নথি",
    csv_file: "ফাইলের নাম",
    csv_pages: "পৃষ্ঠা",
    csv_expiry: "মেয়াদ শেষের তারিখ",
    csv_status: "অবস্থা",

    foot_privacy: "সব ফাইল আপনার ব্রাউজারেই প্রক্রিয়া করা হয়। কোথাও আপলোড করা হয় না।"
  }
};

/* Bangla digits for numbers shown in the Bangla interface. */
const BN_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];

function localizeNumber(n, lang){
  const s = String(n);
  return lang === "bn" ? s.replace(/\d/g, d => BN_DIGITS[+d]) : s;
}
