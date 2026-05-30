import Foundation
import UIKit
import Capacitor
import GoogleMobileAds

// 네이티브 광고 고급형 (Native Advanced) Capacitor 플러그인.
//
// JS 측에서 광고 슬롯 자리에 placeholder div 를 렌더링한 뒤
// `loadAd` -> `mountAd` 순서로 호출하면 GADAdLoader 로 받아온 GADNativeAd 를
// GADNativeAdView 로 WebView 위에 오버레이합니다. JS는 스크롤마다
// `updateAdFrame` 으로 DOMRect 를 알려주고, 컴포넌트가 unmount 될 때
// `unmountAd` 로 정리합니다.

@objc(AdMobNativePlugin)
public class AdMobNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AdMobNativePlugin"
    public let jsName = "AdMobNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadAd", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "mountAd", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateAdFrame", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unmountAd", returnType: CAPPluginReturnPromise)
    ]

    private var loadedAds: [String: GADNativeAd] = [:]
    private var mountedViews: [String: GADNativeAdView] = [:]
    private var adLoaders: [String: GADAdLoader] = [:]
    private var loaderDelegates: [String: NativeAdLoaderDelegate] = [:]

    @objc func initialize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            GADMobileAds.sharedInstance().start { _ in
                call.resolve(["initialized": true])
            }
        }
    }

    @objc func loadAd(_ call: CAPPluginCall) {
        guard let adUnitId = call.getString("adUnitId") else {
            call.reject("adUnitId required")
            return
        }
        let adId = call.getString("id") ?? UUID().uuidString

        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController else {
                call.reject("no root view controller")
                return
            }
            let loader = GADAdLoader(
                adUnitID: adUnitId,
                rootViewController: vc,
                adTypes: [.native],
                options: nil
            )
            let delegate = NativeAdLoaderDelegate(adId: adId) { [weak self] result in
                guard let self = self else { return }
                switch result {
                case .success(let nativeAd):
                    self.loadedAds[adId] = nativeAd
                    call.resolve([
                        "id": adId,
                        "headline": nativeAd.headline ?? "",
                        "body": nativeAd.body ?? "",
                        "callToAction": nativeAd.callToAction ?? "",
                        "advertiser": nativeAd.advertiser ?? "",
                        "store": nativeAd.store ?? "",
                        "price": nativeAd.price ?? "",
                        "iconUrl": nativeAd.icon?.imageURL?.absoluteString ?? "",
                        "hasMedia": nativeAd.mediaContent.hasVideoContent || (nativeAd.images?.isEmpty == false)
                    ])
                case .failure(let error):
                    self.adLoaders.removeValue(forKey: adId)
                    self.loaderDelegates.removeValue(forKey: adId)
                    call.reject("ad load failed: \(error.localizedDescription)")
                }
            }
            loader.delegate = delegate
            self.adLoaders[adId] = loader
            self.loaderDelegates[adId] = delegate
            loader.load(GADRequest())
        }
    }

    @objc func mountAd(_ call: CAPPluginCall) {
        guard let adId = call.getString("id") else {
            call.reject("id required")
            return
        }
        guard let frame = call.getObject("frame"),
              let x = frame["x"] as? Double,
              let y = frame["y"] as? Double,
              let width = frame["width"] as? Double,
              let height = frame["height"] as? Double else {
            call.reject("frame required")
            return
        }

        DispatchQueue.main.async {
            guard let ad = self.loadedAds[adId] else {
                call.reject("ad not loaded for id=\(adId)")
                return
            }
            guard let webView = self.bridge?.webView,
                  let host = webView.superview else {
                call.reject("no host view")
                return
            }

            // Remove any prior view for this id
            self.mountedViews[adId]?.removeFromSuperview()

            let adView = NativeAdCardView()
            adView.frame = CGRect(x: x, y: y, width: width, height: height)
            adView.bind(ad: ad)
            host.insertSubview(adView, aboveSubview: webView)
            self.mountedViews[adId] = adView

            call.resolve(["mounted": true])
        }
    }

    @objc func updateAdFrame(_ call: CAPPluginCall) {
        guard let adId = call.getString("id"),
              let frame = call.getObject("frame") else {
            call.reject("id and frame required")
            return
        }
        let x = (frame["x"] as? Double) ?? 0
        let y = (frame["y"] as? Double) ?? 0
        let width = (frame["width"] as? Double) ?? 0
        let height = (frame["height"] as? Double) ?? 0

        DispatchQueue.main.async {
            if let view = self.mountedViews[adId] {
                view.frame = CGRect(x: x, y: y, width: width, height: height)
                view.setNeedsLayout()
            }
            call.resolve()
        }
    }

    @objc func unmountAd(_ call: CAPPluginCall) {
        guard let adId = call.getString("id") else {
            call.reject("id required")
            return
        }
        DispatchQueue.main.async {
            self.mountedViews[adId]?.removeFromSuperview()
            self.mountedViews.removeValue(forKey: adId)
            self.loadedAds.removeValue(forKey: adId)
            self.adLoaders.removeValue(forKey: adId)
            self.loaderDelegates.removeValue(forKey: adId)
            call.resolve()
        }
    }
}

// MARK: - AdLoader Delegate

final class NativeAdLoaderDelegate: NSObject, GADNativeAdLoaderDelegate {
    let adId: String
    private let completion: (Result<GADNativeAd, Error>) -> Void
    private var didComplete = false

    init(adId: String, completion: @escaping (Result<GADNativeAd, Error>) -> Void) {
        self.adId = adId
        self.completion = completion
    }

    func adLoader(_ adLoader: GADAdLoader, didReceive nativeAd: GADNativeAd) {
        guard !didComplete else { return }
        didComplete = true
        completion(.success(nativeAd))
    }

    func adLoader(_ adLoader: GADAdLoader, didFailToReceiveAdWithError error: Error) {
        guard !didComplete else { return }
        didComplete = true
        completion(.failure(error))
    }
}

// MARK: - GADNativeAdView with OCL look & feel

final class NativeAdCardView: GADNativeAdView {

    private let badgeLabel = UILabel()
    private let sponsoredLabel = UILabel()
    private let headlineLabel = UILabel()
    private let bodyLabel = UILabel()
    private let iconImageView = UIImageView()
    private let advertiserLabel = UILabel()
    private let ctaButton = UIButton(type: .system)
    private let separator = UIView()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupSubviews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupSubviews()
    }

    private func setupSubviews() {
        backgroundColor = UIColor.white.withAlphaComponent(0.92)
        layer.cornerRadius = 24
        layer.borderWidth = 1
        layer.borderColor = UIColor(red: 0.99, green: 0.83, blue: 0.45, alpha: 0.6).cgColor
        clipsToBounds = true

        badgeLabel.text = "광고 · AD"
        badgeLabel.font = .systemFont(ofSize: 10, weight: .heavy)
        badgeLabel.textColor = UIColor(red: 0.71, green: 0.49, blue: 0.05, alpha: 1)
        badgeLabel.backgroundColor = UIColor(red: 1.0, green: 0.95, blue: 0.78, alpha: 1)
        badgeLabel.textAlignment = .center
        badgeLabel.layer.cornerRadius = 8
        badgeLabel.clipsToBounds = true
        addSubview(badgeLabel)

        sponsoredLabel.text = "Sponsored"
        sponsoredLabel.font = .systemFont(ofSize: 11, weight: .semibold)
        sponsoredLabel.textColor = UIColor(red: 0.71, green: 0.49, blue: 0.05, alpha: 1)
        addSubview(sponsoredLabel)

        headlineLabel.font = .systemFont(ofSize: 17, weight: .heavy)
        headlineLabel.numberOfLines = 2
        headlineLabel.textColor = .black
        addSubview(headlineLabel)
        headlineView = headlineLabel

        bodyLabel.font = .systemFont(ofSize: 13, weight: .medium)
        bodyLabel.numberOfLines = 2
        bodyLabel.textColor = UIColor(white: 0.4, alpha: 1)
        addSubview(bodyLabel)
        bodyView = bodyLabel

        separator.backgroundColor = UIColor(red: 0.99, green: 0.83, blue: 0.45, alpha: 0.45)
        addSubview(separator)

        iconImageView.contentMode = .scaleAspectFit
        iconImageView.layer.cornerRadius = 18
        iconImageView.clipsToBounds = true
        iconImageView.layer.borderWidth = 1
        iconImageView.layer.borderColor = UIColor(red: 0.99, green: 0.83, blue: 0.45, alpha: 0.6).cgColor
        iconImageView.backgroundColor = .white
        addSubview(iconImageView)
        iconView = iconImageView

        advertiserLabel.font = .systemFont(ofSize: 11, weight: .semibold)
        advertiserLabel.textColor = UIColor(red: 0.71, green: 0.49, blue: 0.05, alpha: 1)
        advertiserLabel.numberOfLines = 1
        addSubview(advertiserLabel)
        advertiserView = advertiserLabel

        ctaButton.titleLabel?.font = .systemFont(ofSize: 12, weight: .heavy)
        ctaButton.setTitleColor(UIColor(red: 0.71, green: 0.49, blue: 0.05, alpha: 1), for: .normal)
        ctaButton.backgroundColor = .white
        ctaButton.layer.cornerRadius = 18
        ctaButton.layer.borderWidth = 1
        ctaButton.layer.borderColor = UIColor(red: 0.99, green: 0.83, blue: 0.45, alpha: 0.7).cgColor
        ctaButton.isUserInteractionEnabled = false // GADNativeAdView handles clicks
        addSubview(ctaButton)
        callToActionView = ctaButton
    }

    func bind(ad: GADNativeAd) {
        headlineLabel.text = ad.headline
        bodyLabel.text = ad.body?.isEmpty == false ? ad.body : "광고는 서비스 유지에 도움이 됩니다."
        advertiserLabel.text = ad.advertiser ?? ad.store ?? "Google AdMob"
        ctaButton.setTitle(ad.callToAction ?? "자세히", for: .normal)
        iconImageView.image = ad.icon?.image
        nativeAd = ad
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let pad: CGFloat = 20

        badgeLabel.sizeToFit()
        let badgeW = badgeLabel.bounds.width + 14
        let badgeH: CGFloat = 22
        badgeLabel.frame = CGRect(x: pad, y: 18, width: badgeW, height: badgeH)

        sponsoredLabel.sizeToFit()
        sponsoredLabel.frame = CGRect(
            x: bounds.width - pad - sponsoredLabel.bounds.width,
            y: 22,
            width: sponsoredLabel.bounds.width,
            height: 14
        )

        let contentTop = badgeLabel.frame.maxY + 14
        let contentWidth = bounds.width - pad * 2

        headlineLabel.frame = CGRect(x: pad, y: contentTop, width: contentWidth, height: 22)
        let headlineSize = headlineLabel.sizeThatFits(CGSize(width: contentWidth, height: 60))
        headlineLabel.frame.size.height = headlineSize.height

        bodyLabel.frame = CGRect(
            x: pad,
            y: headlineLabel.frame.maxY + 8,
            width: contentWidth,
            height: 18
        )
        let bodySize = bodyLabel.sizeThatFits(CGSize(width: contentWidth, height: 60))
        bodyLabel.frame.size.height = bodySize.height

        let footerTop = bodyLabel.frame.maxY + 14
        separator.frame = CGRect(x: pad, y: footerTop, width: contentWidth, height: 1)

        let footerY = separator.frame.maxY + 14
        iconImageView.frame = CGRect(x: pad, y: footerY, width: 36, height: 36)
        advertiserLabel.frame = CGRect(
            x: iconImageView.frame.maxX + 10,
            y: footerY + 10,
            width: contentWidth - 80 - 36,
            height: 16
        )

        let ctaSize: CGSize = ctaButton.titleLabel?.intrinsicContentSize ?? CGSize(width: 60, height: 14)
        let ctaW = max(72, ctaSize.width + 24)
        ctaButton.frame = CGRect(
            x: bounds.width - pad - ctaW,
            y: footerY + 2,
            width: ctaW,
            height: 32
        )
    }
}
