using System;
using Process_Monitor;
using System.Data.Entity;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Process_Monitor.Models;  // Replace with your actual namespace
using Ninject;
using Ninject.Web.Common;
using Unity;
using Unity.Mvc5;
using System.Web.Optimization;

namespace Process_Monitor
{
    public class MvcApplication : HttpApplication
    {
        public static IKernel Kernel { get; private set; }

        protected void Application_Start()
        {
            var container = new UnityContainer();
            container.RegisterType<DbContext, ApplicationDbContext>();
            DependencyResolver.SetResolver(new UnityDependencyResolver(container));


            // Register Routes
            AreaRegistration.RegisterAllAreas();
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            Database.SetInitializer<ApplicationDbContext>(null);

            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }


        // Handle DI Resolution in Controllers
        protected void Application_EndRequest()
        {
            // Dispose DI container at the end of the request
            //Kernel.Dispose();
        }
    }
}
