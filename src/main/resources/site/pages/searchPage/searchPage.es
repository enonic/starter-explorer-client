import {search} from '/lib/explorer';
import {toStr} from '/lib/util';
import {dlv as getIn} from '/lib/util/object';
import {sanitize} from '/lib/xp/common';
import {
	//getComponent,
	getContent as getCurrentContent,
	getSite as getCurrentSite,
	getSiteConfig,
	serviceUrl as getServiceUrl
} from '/lib/xp/portal';
import {render} from '/lib/thymeleaf';


const VIEW = resolve('searchPage.th.html');

const APP_NAME = sanitize(app.name).replace(/\./g, '-');
//log.info(toStr({APP_NAME}));


export function get({params}) {
	//log.info(toStr({params}));

	/*const serviceUrl = getServiceUrl({
		params: {
			q: 'test'
		},
		service: 'searchDefaultInterface',
		type: 'absolute'
	});
	log.info(`serviceUrl:${serviceUrl}`);*/

	/*const component = getComponent();
	log.info(`component:${component}`);*/

	const currentContent = getCurrentContent();
	//log.info(toStr({currentContent}));

	const siteConfig = getSiteConfig();
	//log.info(toStr({siteConfig}));

	const {language} = currentContent;
	//log.info(`language:${language}`);

	const {language: siteLang} = getCurrentSite();
	//log.info(`siteLang:${siteLang}`);

	// Using Accept-Language is a bad idea as most browsers set english by default
	const locale = params.locale/* || headers['Accept-Language']*/ || language || siteLang || 'nb-NO';
	//log.info(`locale:${locale}`);

	const name = getIn(currentContent, 'page.config.queryParamName', // Page
		getIn(currentContent, 'data.queryParamName', // Content Type
			getIn(currentContent, `x.${APP_NAME}.search.queryParamName`, // X-data
				getIn(siteConfig, 'queryParamName') // Site config
			)
		)
	);
	//log.info(`name:${name}`);

	const searchString = params[name] || '';
	//log.info(`searchString:${searchString}`);

	/*const pageInterfaceName = getIn(currentContent, 'page.config.interfaceName');
	log.info(`pageInterfaceName:${pageInterfaceName}`);

	const currentContentDataInterfaceName = getIn(currentContent, 'data.interfaceName');
	log.info(`currentContentDataInterfaceName:${currentContentDataInterfaceName}`);

	const xInterfaceName = getIn(currentContent, `x.${APP_NAME}.search.interfaceName`);
	log.info(`xInterfaceName:${xInterfaceName}`);

	const siteConfigInterfaceName = getIn(siteConfig, 'interfaceName');
	log.info(`siteConfigInterfaceName:${siteConfigInterfaceName}`);*/

	const interfaceName = getIn(currentContent, 'page.config.interfaceName', // Page
		getIn(currentContent, 'data.interfaceName', // Content Type
			getIn(currentContent, `x.${APP_NAME}.search.interfaceName`, // X-data
				getIn(siteConfig, 'interfaceName') // Site config
			)
		)
	);
	//log.info(`interfaceName:${interfaceName}`);
	if (!interfaceName) {
		return {
			body: `<html>
			  <body>
			    <h1>Interface not configured!</h1>
					<p>You can select the default interface for the entire site in the application site config.</p>
			  </body>
			</html>`,
			contentType: 'text/html;charset=utf-8'
		}
	}

	const searchParams = {
		/*count: 10,
		facets: {
			language: params.language,
		},*/
		interface: interfaceName,
		locale,
		name,
		//page,
		searchString
	};
	//log.info(toStr({searchParams}));

	const res = search(searchParams);
	log.info(toStr({res}));

	const {hits} = res;

	const model = {
		hits,
		name,
		searchString
	};

	return {
		body: render(VIEW, model),
		contentType: 'text/html;charset=utf-8'
	}
}
