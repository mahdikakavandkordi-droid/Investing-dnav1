update public.question_bank set prompt_fr='Si vous êtes sûr à 80 % qu’une prévision est correcte, à quelle fréquence pensez-vous avoir réellement raison ?', options_fr='[{"label":"Environ 50 %","value":"A"},{"label":"Environ 65 %","value":"B"},{"label":"Environ 80 %","value":"C"},{"label":"Environ 95 %","value":"D"}]'::jsonb where version='v1.3' and question_id='BD05';

update public.question_bank set prompt_fr='Quand quelqu’un vous parle d’un gros gain en investissement, à quel point cela influence-t-il vos propres décisions ?', prompt_fa='وقتی کسی از سود بزرگی در سرمایه‌گذاری صحبت می‌کند، این موضوع چقدر روی تصمیم‌های شما اثر می‌گذارد؟' where version='v1.3' and question_id='BD06';

update public.question_bank set prompt_fr='Un placement a gagné 40 % au cours de la dernière année. Cela vous donne-t-il davantage envie de l’acheter ?', prompt_fa='یک سرمایه‌گذاری در یک سال گذشته ۴۰٪ رشد کرده است. آیا این موضوع باعث می‌شود بیشتر به خرید آن علاقه‌مند شوید؟' where version='v1.3' and question_id='BD07';

update public.question_bank set prompt_fr='Vous avez acheté un placement à 100 $ et il vaut maintenant 60 $. Pour décider quoi faire ensuite, quel montant avez-vous le plus tendance à garder en tête ?', prompt_fa='یک سرمایه‌گذاری را با قیمت ۱۰۰ دلار خریده‌اید و حالا قیمت آن ۶۰ دلار است. برای تصمیم بعدی، بیشتر کدام مبلغ در ذهن شماست؟' where version='v1.3' and question_id='BD08';

update public.question_bank set prompt_fr='Vos recherches appuient un placement, mais trois analystes de confiance ne sont pas d’accord avec vous. Quelle réaction vous ressemble le plus ?', prompt_fa='تحقیقات شما از یک سرمایه‌گذاری حمایت می‌کند، اما سه تحلیلگر مورداعتماد با شما مخالف‌اند. کدام واکنش بیشتر شبیه شماست؟' where version='v1.3' and question_id='BD09';

update public.question_bank set prompt_fr='Vous vendez un placement, puis son prix monte de 20 %. À quel point ce regret influencerait-il votre prochaine décision d’investissement ?', prompt_fa='یک سرمایه‌گذاری را می‌فروشید و بعد قیمت آن ۲۰٪ بالا می‌رود. این پشیمانی چقدر روی تصمیم سرمایه‌گذاری بعدی شما اثر می‌گذارد؟' where version='v1.3' and question_id='BD10';

update public.question_bank set prompt_fr='Vous réalisez un gain important sur un placement. Que feriez-vous le plus probablement ?', prompt_fa='از یک سرمایه‌گذاری سود قابل‌توجهی به دست آورده‌اید. احتمالاً چه کار می‌کنید؟' where version='v1.3' and question_id='BD11';

update public.question_bank set prompt_fr='De nouvelles informations vont à l’encontre d’un placement que vous aimiez. Que feriez-vous le plus probablement ?', prompt_fa='اطلاعات جدید با سرمایه‌گذاری‌ای که قبلاً به آن علاقه داشتید در تضاد است. احتمالاً چه کار می‌کنید؟' where version='v1.3' and question_id='BD12';

update public.question_bank set prompt_fr='À quel point vous sentez-vous capable de comprendre les informations financières et les informations sur les investissements ?', prompt_fa='چقدر خودتان را در درک اطلاعات مالی و سرمایه‌گذاری توانمند می‌دانید؟' where version='v1.3' and question_id='BD13';

update public.question_bank set prompt_fr='Quand les marchés bougent fortement, à quel point vous est-il difficile de respecter le plan que vous aviez préparé ?', prompt_fa='وقتی بازار نوسان شدیدی دارد، پایبند ماندن به برنامه‌ای که از قبل تعیین کرده‌اید چقدر برایتان دشوار است؟' where version='v1.3' and question_id='BD14';

update public.question_bank set prompt_fr='Le marché baisse et crée une occasion d’acheter un placement que vous avez étudié. Qu’est-ce qui vous donnerait le plus envie d’acheter ?', prompt_fa='بازار افت می‌کند و برای سرمایه‌گذاری‌ای که درباره‌اش تحقیق کرده‌اید فرصتی برای خرید ایجاد می‌شود. چه چیزی بیشتر شما را به خرید ترغیب می‌کند؟' where version='v1.3' and question_id='BD15';

update public.question_bank set prompt_fr='Quel est approximativement le revenu annuel de votre ménage ?', prompt_fa='درآمد سالانه تقریبی خانوار شما چقدر است؟' where version='v1.3' and question_id='RC01';

update public.question_bank set prompt_fr='Dans quelle mesure le revenu de votre ménage sur lequel vous comptez le plus est-il stable ?', prompt_fa='درآمد خانواری که بیشترین اتکا را به آن دارید چقدر باثبات است؟' where version='v1.3' and question_id='RC02';

update public.question_bank set prompt_fr='Environ combien d’argent avez-vous actuellement disponible pour investir ?', prompt_fa='تقریباً چه مقدار پول یا دارایی مالی برای سرمایه‌گذاری در اختیار دارید؟' where version='v1.3' and question_id='RC03';

update public.question_bank set prompt_fr='Comment décririez-vous votre niveau d’endettement actuel ?', prompt_fa='وضعیت بدهی فعلی خود را چگونه توصیف می‌کنید؟' where version='v1.3' and question_id='RC04';

update public.question_bank set prompt_fr='Pendant combien de mois votre épargne d’urgence pourrait-elle couvrir vos dépenses essentielles ?', prompt_fa='پس‌انداز اضطراری شما چند ماه می‌تواند هزینه‌های ضروری‌تان را پوشش دهد؟' where version='v1.3' and question_id='RC05';

update public.question_bank set prompt_fr='Combien de personnes dépendent financièrement de votre revenu ?', prompt_fa='چند نفر از نظر مالی به درآمد شما وابسته‌اند؟' where version='v1.3' and question_id='RC06';

update public.question_bank set prompt_fr='Si votre portefeuille perdait 20 %, quel effet cela aurait-il sur votre vie quotidienne ?', prompt_fa='اگر ارزش پرتفوی شما ۲۰٪ کاهش پیدا کند، چه اثری بر زندگی روزمره شما خواهد داشت؟' where version='v1.3' and question_id='RC07';

update public.question_bank set prompt_fr='Si vous faisiez un seul placement, environ quel pourcentage de vos actifs financiers représenterait-il ?', prompt_fa='اگر یک سرمایه‌گذاری انجام دهید، تقریباً چه درصدی از کل دارایی‌های مالی شما را تشکیل می‌دهد؟' where version='v1.3' and question_id='RC08';

update public.question_bank set prompt_fr='Si ce placement perdait 20 %, auriez-vous encore assez d’épargne ou d’autres actifs pour faire face à une grosse dépense imprévue ?', prompt_fa='اگر این سرمایه‌گذاری ۲۰٪ افت کند، آیا همچنان پس‌انداز یا دارایی دیگری برای پوشش یک هزینه بزرگ و پیش‌بینی‌نشده خواهید داشت؟' where version='v1.3' and question_id='RC09';

update public.question_bank set prompt_fr='À quel point la source de revenu sur laquelle vous comptez le plus est-elle sûre et stable ?', prompt_fa='منبع درآمدی که بیشترین اتکا را به آن دارید چقدر امن و باثبات است؟' where version='v1.3' and question_id='RC10';

update public.question_bank set prompt_fr='Après une perte importante, dans quelle mesure réduiriez-vous le risque de vos prochains placements, même si vos objectifs à long terme n’ont pas changé ?', prompt_fa='بعد از یک زیان قابل‌توجه، حتی اگر اهداف بلندمدت شما تغییری نکرده باشند، چقدر احتمال دارد ریسک سرمایه‌گذاری‌های بعدی خود را کاهش دهید؟' where version='v1.3' and question_id='RT07B';

update public.question_bank set options_fa='[{"label":"اصلاً مطمئن نیستم","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"کاملاً مطمئن هستم","value":10}]'::jsonb, options_fr='[{"label":"Pas du tout confiant","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Tout à fait confiant","value":10}]'::jsonb where version='v1.3' and question_id='BD03';

update public.question_bank set options_fr='[{"label":"Pas du tout","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Très souvent","value":10}]'::jsonb, options_fa='[{"label":"اصلاً انتظار ندارم","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"خیلی زیاد انتظار دارم","value":10}]'::jsonb where version='v1.3' and question_id='BD04';

update public.question_bank set options_fr='[{"label":"Pas du tout influencé","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Très influencé","value":10}]'::jsonb where version='v1.3' and question_id='BD06';

update public.question_bank set options_fr='[{"label":"Pas du tout","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Tout à fait","value":10}]'::jsonb where version='v1.3' and question_id='BD10';

update public.question_bank set options_fr='[{"label":"Pas du tout capable","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Tout à fait capable","value":10}]'::jsonb where version='v1.3' and question_id='BD13';

update public.question_bank set options_fr='[{"label":"Pas du tout difficile","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Très difficile","value":10}]'::jsonb where version='v1.3' and question_id='BD14';